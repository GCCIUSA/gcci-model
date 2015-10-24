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
        this.$rootScope.model.getTree().then((data) => {
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
            this.$rootScope.model.addChild(target, { "title": data.title, "uid": data.email }).then(() => {
                this.loadTree();
            });
        });
    }

    addSibling(target, pos) {

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
}

MainCtrl.$inject = ["$rootScope", "utilService", "$mdDialog", "$window"];