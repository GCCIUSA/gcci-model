export class UtilService {
    constructor($mdToast) {
        this.$mdToast = $mdToast;
    }

    toast(content) {
        this.$mdToast.show(
            this.$mdToast.simple()
                .position("top right")
                .content(content)
                .hideDelay(2000)
        );
    }
}

UtilService.$inject = ["$mdToast"];