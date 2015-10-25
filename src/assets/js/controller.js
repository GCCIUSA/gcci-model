import { GCCIModel } from "./model-deferred";

export class MainCtrl {
    constructor($rootScope, utilService, $mdDialog, $window) {
        this.$rootScope = $rootScope;
        this.utilService = utilService;
        this.$mdDialog = $mdDialog;
        this.$window = $window;

        this.init();
    }

    init() {
        this.loadTree();
    }

    loadTree() {
        this.$rootScope.api.getTree().then((data) => {
            this.$rootScope.$apply(() => {
                this.tree = data;
            });
        });
    }

    openMenu($mdOpenMenu, evt) {
        $mdOpenMenu(evt);
    }

    calcIndentation(depth) {
        return (depth - 2) * 40;
    }

    /**
     * Adds a new node as a rightmost child of the target node.
     */
    addChild(target, evt) {
        this.$mdDialog.show({
            controller: ["$scope", "$mdDialog",
                ($scope, $mdDialog) => {
                    $scope.cancel = () => {
                        $mdDialog.cancel();
                    };

                    $scope.save = () => {
                        $mdDialog.hide({
                            "title": $scope.title,
                            "email": $scope.email
                        });
                    };
                }
            ],
            templateUrl: 'assets/md-templates/node-editor.html',
            parent: angular.element(document.body),
            targetEvent: evt
        }).then((data) => {
            this.$rootScope.api.getChildren(target).then((children) => {
                // calculate new node's path
                let childIndex = children.length > 0 ? this.getNodeIndex(children[children.length - 1]) + 1 : 1;
                let childPath = target.path + this.indexToPath(childIndex);

                // insert new node
                this.$rootScope.ref.push({
                    "title": data.title,
                    "uid": data.email,
                    "path": childPath,
                    "depth": this.getPathDepth(childPath)
                }, (error) => {
                    if (error) {
                        throw error;
                    }
                    else {
                        this.loadTree();
                    }
                });
            });
        });
    }

    addSibling(target, pos, evt) {
        this.$mdDialog.show({
            controller: ["$scope", "$mdDialog",
                ($scope, $mdDialog) => {
                    $scope.cancel = () => {
                        $mdDialog.cancel();
                    };

                    $scope.save = () => {
                        $mdDialog.hide({
                            "title": $scope.title,
                            "email": $scope.email
                        });
                    };
                }
            ],
            templateUrl: 'assets/md-templates/node-editor.html',
            parent: angular.element(document.body),
            targetEvent: evt
        }).then((data) => {
            this.$rootScope.model.addSibling(target, pos, {"title": data.title, "uid": data.email});
        });
    }

    remove(node, evt) {
        this.$mdDialog.show(
            this.$mdDialog.confirm()
                .title("Confirm")
                .content("Deleting this node will result in deleting all of its descendants. Are you sure to continue?")
                .targetEvent(evt)
                .ok("Confirm")
                .cancel("Cancel")
        ).then(() => {
            this.$rootScope.model.remove(node);
        });
    }

    move(node, target, pos) {

    }

    getPathDepth(path) {
        return path.length / 4;
    }

    getNodeIndex(node) {
        return parseInt(node.path.substr(node.path.length - 4));
    }

    pathToIndex(path) {
        return parseInt(path);
    }

    indexToPath(index) {
        return (10000 + index).toString().substr(1);
    }
}

MainCtrl.$inject = ["$rootScope", "utilService", "$mdDialog", "$window"];