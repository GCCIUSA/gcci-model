/**
 * ------------------------------------------
 * Name:    GCCI Model Script
 * Version: 1.0.0
 * Author:  PZ
 * Date:    2015-10-15
 * ------------------------------------------
 *
 * Change Log:
 *
 * 1.0.0 (2015-10-15)
 * - added basic model structure
 */

/**
 * GCCI Model
 *
 * @class GCCIModel
 */
export class GCCIModel {
    constructor() {
        // defines errors
        this.errors = {
            "NOT_READY": new Error("GCCIModel is not ready. Listen for 'GCCIMODEL_READY' event on 'document' object."),
            "INVALID_MOVE": new Error("Cannot move node to one of its descendants.")
        };

        // defines firebase root reference
        this.rootRef = new Firebase("https://gcci-model.firebaseio.com/");
    }

    /**
     * Gets node by given node's id.
     *
     * @param id - given node's id
     * @returns {Promise} node if found, else null
     */
    getNodeById(id) {
        let deferred = $.Deferred();

        this.rootRef.orderByKey().equalTo(id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.val());
        });

        return deferred.promise();
    }

    /**
     * Gets firebase reference by given node's id.
     *
     * @param id - given node's id
     * @returns {Promise} firebase reference if found, else null
     */
    getRefById(id) {
        let deferred = $.Deferred();

        this.rootRef.orderByKey().equalTo(id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.ref());
        });

        return deferred.promise();
    }

    /**
     * Gets tree data structure with DFS.
     *
     * @method getTree
     * @return {Promise} an array of nodes
     */
    getTree() {
        let deferred = $.Deferred();

        this.rootRef.orderByChild("path").once("value", (snapshot) => {
            let parsed = GCCIModel.parse(snapshot.val());
            GCCIModel.sortNodesByPath(parsed);
            deferred.resolve(parsed);
        });

        return deferred.promise();
    }

    /**
     * Gets the children nodes of the given node.
     *
     * @method getChildren
     * @param {Object} node given node
     * @returns {Promise} array of children nodes
     */
    getChildren(node) {
        let deferred = $.Deferred();

        this.rootRef.orderByChild("path").startAt(node.path).once("value", (snapshot) => {
            let children = [];
            for (let n of GCCIModel.parse(snapshot.val())) {
                if (n.depth === node.depth + 1) {
                    children.push(n);
                }
            }
            children.sort((a, b) => a.path.localeCompare(b.path));
            deferred.resolve(children);
        });

        return deferred.promise();
    }

    /**
     * Gets the descendants nodes of the give node.
     *
     * @method getDescendants
     * @param {Object} node given node
     * @returns {Promise} array of descendants nodes
     */
    getDescendants(node) {
        let deferred = $.Deferred();

        this.rootRef.orderByChild("path").startAt(node.path).once("value", (snapshot) => {
            let descendants = [];
            for (let n of GCCIModel.parse(snapshot.val())) {
                if (GCCIModel.isDescendantOf(n, node)) {
                    descendants.push(n);
                }
            }
            GCCIModel.sortNodesByPath(descendants);
            deferred.resolve(descendants);
        });

        return deferred.promise();
    }

    /**
     * Gets the parent node of the given node.
     *
     * @method getParent
     * @param {Object} node given node
     * @returns {Promise} parent node
     */
    getParent(node) {
        let deferred = $.Deferred();

        this.rootRef.orderByChild("path").equalTo(GCCIModel.getParentPath(node)).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.val());
        });

        return deferred.promise();
    }

    /**
     * Gets the siblings nodes of the given node.
     *
     * @method getSiblings
     * @param {Object} node given node
     * @returns {Promise} array of siblings nodes
     */
    getSiblings(node) {
        let deferred = $.Deferred();

        this.rootRef.orderByChild("path").startAt(GCCIModel.getParentPath(node)).once("value", (snapshot) => {
            let siblings = [];
            for (let n of GCCIModel.parse(snapshot.val())) {
                if (GCCIModel.getParentPath(n) === GCCIModel.getParentPath(node)) {
                    siblings.push(n);
                }
            }
            GCCIModel.sortNodesByPath(siblings);
            deferred.resolve(siblings);
        });

        return deferred.promise();
    }

    /**
     * Adds a new node as a child to the given node.
     * The new node will be the new rightmost child.
     * If you want to insert a node at a specific position, use the addSibling() method.
     *
     * @method addChild
     * @param {Object} target target node
     * @param {Object} data new node's data
     * @return {Promise}
     */
    addChild(target, data) {
        let deferred = $.Deferred();

        let childPath = GCCIModel.calcPathAppend(target.path, GCCIModel.indexToPath(target.numChild + 1));
        this.rootRef.push({
            "title": data.title,
            "uid": data.uid,
            "path": childPath,
            "depth": GCCIModel.getDepth(childPath),
            "numChild": 0
        }, (error) => {
            if (error) {
                deferred.reject(error);
            }
            else {
                this.rootRef.orderByKey().equalTo(target.id).once("child_added", (snapshot) => {
                    snapshot.ref().update({ "numChild": target.numChild + 1 }, (error) => {
                        if (error) {
                            deferred.reject(error);
                        }
                        else {
                            deferred.resolve();
                        }
                    });
                });
            }
        });

        return deferred.promise();
    }

    /**
     * Adds a new node as a sibling to the target node object.
     *
     * @method addSibling
     * @param {Object} target target node
     * @param {String} pos possible values are: left, right
     * @param {Object} data new node's data
     */
    addSibling(target, pos, data) {
        // shift target's siblings
        if (pos === "left" || pos === "right") {
            let newNodePath = pos === "left" ? target.path : GCCIModel.calcPathShift(target.path, 1);
            console.log(newNodePath);

            /*

            // increase target's parent numChild by 1
            this.rootRef.orderByChild("path").equalTo(GCCIModel.getParentPath(target)).once("child_added", (snapshot) => {
                snapshot.ref().update({
                    "numChild": snapshot.val().numChild + 1
                });
            }); */

            // update path of target siblings
            this.getSiblings(target).then((siblings) => {
                for (let s of siblings) {
                    if (GCCIModel.getPathIndex(s.path) >= GCCIModel.getPathIndex(newNodePath)) {
                        //this.updatePath(s, GCCIModel.calcPathShift(s.path, 1));
                        console.log(s);
                    }
                }
            });

            // insert new node
            /* this.rootRef.push({
                "title": data.title,
                "uid": data.uid,
                "path": newNodePath,
                "depth": GCCIModel.getDepth(newNodePath),
                "numChild": 0
            });
            */
        }
        else {
            throw new Error("Invalid sibling position to add.");
        }
    }

    /**
     * Removes the given node and all its descendants.
     *
     * @method remove
     * @param {Object} node given node
     */
    remove(node) {
        let pathIndex = GCCIModel.getPathIndex(node.path),
            parentPath = GCCIModel.getParentPath(node);

        // remove node and its descendants
        this.rootRef.orderByChild("path").startAt(node.path).on("child_added", (snapshot) => {
            if (GCCIModel.isDescendantOf(snapshot.val(), node) || snapshot.val().path === node.path) {
                snapshot.ref().remove();
            }
        });

        // update path of its right siblings
        this.getSiblings(node).then((siblings) => {
            for (let s of siblings) {
                if (GCCIModel.getPathIndex(s.path) > pathIndex) {
                    this.updatePath(s, GCCIModel.calcPathShift(s.path, -1));
                }
            }
        });

        // reduce numChild of parent by 1
        this.rootRef.orderByChild("path").equalTo(parentPath).once("child_added", (snapshot) => {
            snapshot.ref().update({ "numChild": snapshot.val().numChild - 1 });
        });
    }

    /**
     * Moves the given node and all its descendants to a new position relative to another node.
     *
     * @method move
     * @param {Object} node given node
     * @param {Object} target target node
     * @param {String} pos possible values are: child, left, right
     */
    move(node, target, pos) {
        let [oPath, oSiblings] = [
            node.path,
            this.getSiblings(node)
        ];

        // check if move to an invalid target
        for (let d of this.getDescendants(node)) {
            if (d.id === target.id) {
                throw this.errors.INVALID_MOVE;
            }
        }

        // insert node to new location
        if (pos === "child") {
            let newPath = GCCIModel.calcPathAppend(target.path, GCCIModel.indexToPath(this.getChildren(target).length + 1));
            this.updatePath(node, newPath);
        }
        else if (pos === "left" || pos === "right") {
            let newPath = pos === "left" ? target.path : GCCIModel.calcPathShift(target.path, 1);
            this.updatePath(node, newPath);

            for (let s of this.getSiblings(target)) {
                if (GCCIModel.getPathIndex(s.path) >= GCCIModel.getPathIndex(newNodePath)) {
                    this.updatePath(s, GCCIModel.calcPathShift(s.path, 1));
                }
            }
        }

        // shift node's original location's siblings
        for (let s of oSiblings) {
            if (GCCIModel.getPathIndex(s.path) > GCCIModel.getPathIndex(oPath)) {
                this.updatePath(s, GCCIModel.calcPathShift(s.path, -1));
            }
        }
    }

    /**
     * Updates the path of the given node and all of its descendants.
     * This is not a public API, do not call this directly.
     */
    updatePath(node, newPath) {
        this.rootRef.orderByChild("path").startAt(node.path).on("child_added", (snapshot) => {
            let val = snapshot.val();
            if (GCCIModel.isDescendantOf(val, node) || val.path === node.path) {
                let path = GCCIModel.calcPathAppend(newPath, val.path.substr(node.path.length));
                snapshot.ref().update({
                    "path": path,
                    "depth": GCCIModel.getDepth(path)
                })
            }
        });
    }


    /**
     * Depth First Search
     * This is not a public API, do not call this directly.
     */
    /* static dfs(nodes, node, list = []) {
        if (!node) {
            node = nodes[0];
        }

        list.push(node);

        let children = [];
        for (let n of nodes) {
            if (n.depth === node.depth + 1 && GCCIModel.getParentPath(n) === node.path) {
                children.push(n);
            }
        }
        children.sort((a, b) => a.path.localeCompare(b.path));

        for (let n of children) {
            GCCIModel.dfs(nodes, n, list);
        }

        return list;
    } */

    /**
     * Helper
     * Parses firebase snapshot.val() into an array of node objects.
     */
    static parse(snapshotVal) {
        let parsed = [];

        for (let key of Object.keys(snapshotVal)) {
            let obj = snapshotVal[key];
            obj["id"] = key;
            parsed.push(obj);
        }

        return parsed;
    }

    /**
     * Helper
     * Sorts nodes by path.
     */
    static sortNodesByPath(nodes) {
        nodes.sort((a, b) => {
            return a.path.localeCompare(b.path);
        });
    }

    /**
     * Helper
     * Checks if 'descendant' node is a descendant of 'of' node.
     */
    static isDescendantOf(descendant, of) {
        return descendant.path !== of.path &&  descendant.path.substr(0, of.path.length) === of.path;
    }

    /**
     * Helper
     * Calculates path by shifting given path with specific step.
     */
    static calcPathShift(path, shift) {
        return path.substr(0, path.length - 4) + GCCIModel.indexToPath((GCCIModel.getPathIndex(path) + shift));
    }

    /**
     * Helper
     * Calculates path by appending a path to a given one.
     */
    static calcPathAppend(path, append) {
        return path + append;
    }

    /**
     * Helper
     * Gets depth of given path.
     */
    static getDepth(path) {
        return path.length / 4;
    }

    /**
     * Helper
     * Gets path at a depth.
     */
    static getPathAtDepth(path, depth) {
        return path.substr(0, depth * 4);
    }

    /**
     * Helper
     * Gets parent's path value of the given node.
     */
    static getParentPath(node) {
        return node.path.substr(0, node.path.length - 4);
    }

    /**
     * Helper
     * Gets index at given depth.
     * If no depth specified, gets rightmost index.
     */
    static getPathIndex(path, depth) {
        if (depth) {
            return parseInt(path.substr((depth - 1) * 4, 4));
        }
        return parseInt(path.substr(path.length - 4));
    }

    /**
     * Helper
     * Converts index to path format.
     */
    static indexToPath(index) {
        return (10000 + index).toString().substr(1);
    }
}