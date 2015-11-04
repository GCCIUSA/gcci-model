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

            return true;
        }
        else {
            this.login();

            return false;
        }
    }

    login() {
        let options = {
            "scope": [
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/admin.directory.user.readonly"
            ].join(" ")
        };

        this.fbAuth.$authWithOAuthPopup("google", options).then().catch(() => {
            alert("User Login Failed");
        });
    }

    logout() {
        return this.fbAuth.$unauth();
    }
}

AuthService.$inject = ["$rootScope", "$firebaseAuth"];



export class UserService {
    constructor($rootScope, $q, $http) {
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.$http = $http;
    }

    getAllUsers() {
        let deferred = this.$q.defer();

        this.$http.get(
            "https://www.googleapis.com/admin/directory/v1/users?domain=thegcci.org",
            this.getHttpConfig()
        ).then((response) => {
            deferred.resolve(response.data.users);
        }).catch((error) => {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    getUserByEmail(email) {
        let deferred = this.$q.defer();

        this.$http.get(
            `https://www.googleapis.com/admin/directory/v1/users/${email}`,
            this.getHttpConfig()
        ).then((response) => {
                deferred.resolve(response.data);
            }).catch((error) => {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    getHttpConfig() {
        return {
            "headers": { "Authorization": "Bearer " + this.$rootScope.user.google.accessToken }
        };
    }
}

UserService.$inject = ["$rootScope", "$q", "$http"];
