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
    constructor($rootScope, $firebaseAuth, $http, $q, $mdDialog) {
        this.$rootScope = $rootScope;
        this.$http = $http;
        this.$q = $q;
        this.$mdDialog = $mdDialog;

        this.fbAuth = $firebaseAuth($rootScope.ref);
    }

    getAuth() {
        /**
         * need to check both firebase token and google token.
         * firebase token is for firebase services, google token is for google api service.
         *
         * firebase token is set to expired in 24 hours, google access token is set to expired in 1 hour,
         * will need to use google refresh token to refresh google access token.
         *
         * unfortunately, as of now, there's no way for firebase to obtain a google refresh token, will have to
         * re-authenticate user when google access token has expired.
         */

        let deferred = this.$q.defer();

        // check if firebase token is valid
        this.authInProgress = true;
        this.fbAuth.$onAuth((authData) => {
            if (authData) { // firebase token is valid
                // check if google token is valid
                let url = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${authData.google.accessToken}`;
                this.$http.get(url).then(
                    () => { // google token is valid
                        this.authInProgress = false;
                        this.$rootScope.user = authData;
                        deferred.resolve(true);
                    },
                    (error) => { // google token is invalid
                        this.authInProgress = false;
                        if (error.data.error === "invalid_token") {
                            this.$mdDialog.show(
                                this.$mdDialog.alert()
                                    .title('Error')
                                    .content('Authentication timed out, please login again.')
                                    .ariaLabel('Authentication timed out')
                                    .ok('Close')
                            );
                        }
                        deferred.reject(error);
                    }
                );
            }
            else { // firebase token is invalid
                this.authInProgress = false;
                deferred.reject();
            }
        });

        return deferred.promise;
    }

    login() {
        let options = {
            "scope": [
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/admin.directory.user.readonly"
            ].join(" ")
        };

        this.fbAuth.$authWithOAuthRedirect("google", options).catch(() => {
            this.$mdDialog.show(
                this.$mdDialog.alert()
                    .title('Error')
                    .content('Authentication failed, please try again.')
                    .ariaLabel('Authentication failed')
                    .ok('Close')
            );
        });
    }

    logout() {
        delete this.$rootScope.user;
        this.fbAuth.$unauth();
    }
}

AuthService.$inject = ["$rootScope", "$firebaseAuth", "$http", "$q", "$mdDialog"];



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
