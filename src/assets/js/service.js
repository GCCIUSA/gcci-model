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


export class AuthService {
    constructor($rootScope, $firebaseAuth) {
        this.$rootScope = $rootScope;

        this.fbAuth = $firebaseAuth($rootScope.ref);
    }

    getAuth() {
        let authData = this.fbAuth.$getAuth();
        if (authData) {
            this.$rootScope.user = authData;
        }
        else {
            this.login();
        }
    }

    login() {
        let options = {
            "scope": [
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/admin.directory.user.readonly"
            ].join(" ")
        };

        this.fbAuth.$authWithOAuthPopup("google", options).then(() => {
            // login successful
        }).catch(() => {
            alert("User Login Failed");
        });
    }

    logout() {
        return this.fbAuth.$unauth();
    }
}

AuthService.$inject = ["$rootScope", "$firebaseAuth"];



export class UserService {
    constructor() {
        this.CLIENT_ID = "";
    }

    getUserByEmail(email) {

    }
}
