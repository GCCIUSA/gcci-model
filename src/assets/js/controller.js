export class NodeEditorCtrl {
    constructor($rootScope, $mdDialog, node, domainUsers) {
        this.$mdDialog = $mdDialog;
        this.node = angular.copy(node);
        this.domainUsers = domainUsers;
        this.$rootScope = $rootScope;

        this.init();
    }

    init() {
        this.levels = this.$rootScope.api.getLevels();
        this.leaders = [];

        if (this.node.leaders) {
            for (let leader of this.node.leaders.split(";")) {
                let uidSplit = leader.split(":"),
                    dUser = this.domainUsers.find(x => x.id === uidSplit[1]);

                if (uidSplit[0] === "google" && dUser) {
                    this.leaders.push(dUser);
                }
            }
        }
    }

    filterQuery(searchText) {
        let lcSearchText = searchText.toLowerCase(),
            filteredUsers = [];
        for (let dUser of this.domainUsers) {
            if (dUser.name.fullName.toLowerCase().indexOf(lcSearchText) >= 0) {
                filteredUsers.push(dUser);
            }
        }

        return filteredUsers;
    }

    cancel() {
        this.$mdDialog.cancel();
    }

    save(isValid) {
        if (isValid) {
            this.$mdDialog.hide({
                "title": this.node.title,
                "leaders": this.leaders.map(obj => `google:${obj.id}`).join(";"),
                "level": this.node.level
            });
        }
    }
}

NodeEditorCtrl.$inject = ["$rootScope", "$mdDialog", "node", "domainUsers"];


export class MainCtrl {
    constructor($rootScope, utilService, $mdDialog, $http, authService, userService, $firebaseArray, $q) {
        this.$rootScope = $rootScope;
        this.utilService = utilService;
        this.$mdDialog = $mdDialog;
        this.$http = $http;
        this.authService = authService;
        this.userService = userService;
        this.$firebaseArray = $firebaseArray;
        this.$q = $q;

        this.init();
    }

    init() {
        this.authService.getAuth().then(() => {
            this.loadTree();
            this.userService.getAllUsers().then((data) => {
                this.domainUsers = data;
            });
        });
    }

    getLeaderName(node) {
        if (this.domainUsers && node.leader) {
            for (let dUser of this.domainUsers) {
                if (dUser.emails[0].address === node.leader.email) {
                    return dUser.name.fullName;
                }
            }
        }
    }

    loadTree() {
        this.tree = this.$firebaseArray(this.$rootScope.ref.orderByChild("path"));
    }

    getIndentation(depth) {
        return { 'margin-left': `${(depth - 2) * 40}px` };
    }

    /**
     * Edits a node
     */
    editNode(node, evt) {
        this.$mdDialog.show({
            controller: "NodeEditorCtrl as nodeEditor",
            templateUrl: "assets/md-templates/node-editor.html",
            parent: angular.element(document.body),
            targetEvent: evt,
            locals: { "node": node, "domainUsers": this.domainUsers }
        }).then((data) => {
            this.$rootScope.api.getNodeRef(node).update(data, (error) => {
                if (error) {
                    throw error;
                }
            });
        });
    }

    /**
     * Adds a new node as a rightmost child of the target node.
     */
    addChild(target, evt) {
        this.$mdDialog.show({
            controller: "NodeEditorCtrl as nodeEditor",
            templateUrl: 'assets/md-templates/node-editor.html',
            parent: angular.element(document.body),
            targetEvent: evt,
            locals: { "node": {}, "domainUsers": this.domainUsers }
        }).then((data) => {
            this.$rootScope.api.getChildren(target).then((children) => {
                // calculate new node's path
                let newNodeIndex = children.length > 0 ? this.getNodeIndex(children[children.length - 1]) + 1 : 1;
                let newNodePath = target.path + this.indexToPath(newNodeIndex);

                // insert new node
                this.addNode(data.title, data.leaders, data.level, newNodePath);
            });
        });
    }

    /**
     * Adds a new node as a sibling of the given target.
     * Available pos are: "left", "right".
     */
    addSibling(target, pos, evt) {
        this.$mdDialog.show({
            controller: "NodeEditorCtrl as nodeEditor",
            templateUrl: 'assets/md-templates/node-editor.html',
            parent: angular.element(document.body),
            targetEvent: evt,
            locals: { "node": {}, "domainUsers": this.domainUsers }
        }).then((data) => {
            this.$rootScope.api.getSiblings(target).then((siblings) => {
                let rightSiblings = [],
                    targetIndex = this.getNodeIndex(target);

                // get right siblings of the target.
                for (let n of siblings) {
                    if (this.getNodeIndex(n) > targetIndex + (pos === "left" ? -1 : 0)) {
                        rightSiblings.push(n);
                    }
                }

                // insert new node
                let newNodePath = pos === "left" ? target.path : this.getPathByShiftingIndex(target, 1);
                this.addNode(data.title, data.leaders, data.level, newNodePath);

                for (let n of rightSiblings) {
                    this.updatePath(n, this.getPathByShiftingIndex(n, 1));
                }
            });
        });
    }

    /**
     * Removes node and all of its descendants.
     */
    remove(node, evt) {
        this.$mdDialog.show(
            this.$mdDialog.confirm()
                .title("Confirm")
                .content(`Are you sure to delete ${node.title} and all of its descendants?`)
                .targetEvent(evt)
                .ok("Confirm")
                .cancel("Cancel")
        ).then(() => {
            this.$rootScope.api.getSiblings(node).then((siblings) => {
                let rightSiblings = [],
                    nodeIndex = this.getNodeIndex(node);

                // get right siblings of node
                for (let n of siblings) {
                    if (this.getNodeIndex(n) > nodeIndex) {
                        rightSiblings.push(n);
                    }
                }

                // remove node and all of its descendants
                this.$rootScope.api.getDescendants(node).then((descendants) => {
                    this.$rootScope.api.getNodeRef(node).remove();
                    for (let n of descendants) {
                        this.$rootScope.api.getNodeRef(n).remove();
                    }
                });

                // update path of right siblings
                for (let n of rightSiblings) {
                    this.updatePath(n, this.getPathByShiftingIndex(n, -1));
                }
            });
        });
    }

    /**
     * Moves given node and all of its descendants to a new position relative to the target.
     */
    move(node) {
        this.$rootScope.api.getDescendants(node).then((descendants) => {
            descendants.splice(0, 0, node);
            this.moveNodes = descendants;
        });
    }

    isValidMoveToTarget(node) {
        return this.moveNodes.findIndex(x => x.$id === node.$id) < 0;
    }

    moveTo1(target, pos) {
        let dupTarget = angular.copy(target);

        if (pos === "child") {

        }
        else if (pos === "left" || pos === "right") {
            // target and source are siblings
            if (this.$rootScope.api._isSiblingOf(this.moveNodes[0], target)) {
                if (this.getNodeIndex(target) < this.getNodeIndex(this.moveNodes[0])) { // target is left sibling
                    // update target's right siblings until source node
                    // update source node
                }
                else { // target is right sibling
                    // update source node's right siblings until target node
                    // update source node
                }
            }

            // target and source are not siblings

            // update source node's right siblings
            // update target node's right siblings
            // update source node
        }
    }

    /**
     * The position of target node to move to.
     */
    moveTo(target, pos) {
        // updated moving nodes and related nodes of target
        let updateNewPos = () => {
            if (pos === "child") {
                this.$rootScope.api.getChildren(target).then((children) => {
                    // calculate new path of moving nodes
                    let newIndex = children.length > 0 ? this.getNodeIndex(children[children.length - 1]) + 1 : 1,
                        newPath = target.path + this.indexToPath(newIndex),
                        oNodePath = this.moveNodes[0].path;

                    // update moving nodes
                    for (let n of this.moveNodes) {
                        let nNewPath = newPath + n.path.substr(oNodePath.length);
                        this.$rootScope.api.getNodeRef(n).update({
                            "path": nNewPath,
                            "depth": this.getDepth(nNewPath)
                        });
                    }
                });
            }
            else if (pos === "left" || pos === "right") {
                this.$rootScope.api.getSiblings(target).then((siblings) => {
                    let rightSiblings = [],
                        targetIndex = this.getNodeIndex(target),
                        newPath = pos === "left" ? target.path : this.getPathByShiftingIndex(target, 1),
                        oNodePath = this.moveNodes[0].path;

                    // get right siblings of the target.
                    for (let n of siblings) {
                        if (this.getNodeIndex(n) > targetIndex + (pos === "left" ?  -1 : 0)) {
                            rightSiblings.push(n);
                        }
                    }

                    // update related nodes of target
                    let cnt = 0;
                    for (let n of rightSiblings) {
                        this.updatePath(n, this.getPathByShiftingIndex(n, 1)).then(() => {
                            if (++cnt === rightSiblings.length) {
                                // update moving nodes
                                for (let mn of this.moveNodes) {
                                    let nNewPath = newPath + mn.path.substr(oNodePath.length);
                                    this.$rootScope.api.getNodeRef(mn).update({
                                        "path": nNewPath,
                                        "depth": this.getDepth(nNewPath)
                                    });
                                }
                            }
                        });
                    }
                });
            }
        };

        // update right siblings of original node
        this.$rootScope.api.getSiblings(this.moveNodes[0]).then((siblings) => {
            let rightSiblings = [],
                nodeIndex = this.getNodeIndex(this.moveNodes[0]);

            // get right siblings of node
            for (let n of siblings) {
                if (this.getNodeIndex(n) > nodeIndex) {
                    rightSiblings.push(n);
                }
            }

            // update path of right siblings
            let cnt = 0;
            if (rightSiblings.length > 0) {
                for (let n of rightSiblings) {
                    this.updatePath(n, this.getPathByShiftingIndex(n, -1)).then(() => {
                        if (++cnt === rightSiblings.length) {
                            updateNewPos();
                        }
                    });
                }
            }
            else {
                updateNewPos();
            }
        });

        this.cancelMove();
    }

    /**
     * Cancels move operation.
     */
    cancelMove() {
        this.moveNodes = null;
    }

    /**
     * Updates path of node and all of its descendants.
     */
    updatePath(node, newPath) {
        let deferred = this.$q.defer();

        // update descendants
        this.$rootScope.api.getDescendants(node).then((descendants) => {
            let cnt = 0;

            let updateHandler = (error) => {
                if (error) {
                    deferred.reject(error);
                    throw error;
                }
                else {
                    if (++cnt === descendants.length + 1) {
                        deferred.resolve(true);
                    }
                    console.log(cnt);
                }
            };

            // update node
            this.$rootScope.api.getNodeRef(node).update({
                "path": newPath,
                "depth": this.getDepth(newPath)
            }, updateHandler);

            // update descendants
            for (let n of descendants) {
                let dNewPath = newPath + n.path.substr(node.path.length);
                this.$rootScope.api.getNodeRef(n).update({
                    "path": dNewPath,
                    "depth": this.getDepth(dNewPath)
                }, updateHandler);
            }
        });

        return deferred.promise;
    }

    /**
     * Adds a node.
     */
    addNode(title, leader, level, path, callback) {
        this.$rootScope.ref.push({
            "title": title,
            "leader": leader,
            "level": level,
            "path": path,
            "depth": this.getDepth(path)
        }, (error) => {
            if (error) {
                throw error;
            }
            else if (typeof callback === "function") {
                callback();
            }
        });
    }

    getNodeIndex(node) {
        return parseInt(node.path.substr(node.path.length - 4));
    }
    
    getPathByShiftingIndex(node, toShift) {
        return node.path.substr(0, node.path.length - 4) + this.indexToPath(this.getNodeIndex(node) + toShift);
    }

    getDepth(path) {
        return path.length / 4;
    }

    indexToPath(index) {
        return (10000 + index).toString().substr(1);
    }
}

MainCtrl.$inject = ["$rootScope", "utilService", "$mdDialog", "$http", "authService", "userService", "$firebaseArray", "$q"];