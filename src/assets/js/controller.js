export class MainCtrl {
    constructor($rootScope, utilService) {
        this.$rootScope = $rootScope;
        this.utilService = utilService;
    }

    openMenu($mdOpenMenu, evt) {
        $mdOpenMenu(evt);
    }
}

MainCtrl.$inject = ["$rootScope", "utilService"];