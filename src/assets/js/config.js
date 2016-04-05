import { API } from "../../api/v1/api";
import { UtilService, AuthService, UserService } from "./service";
import { NodeEditorCtrl, MainCtrl } from "./controller";


let app = angular.module("app", ["ngMaterial", "ngMessages", "firebase"]);

app.config(["$httpProvider",
    ($httpProvider) => {
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.timeout = 10 * 1000;

        $httpProvider.defaults.headers.patch = {
            'Content-Type': 'application/json;charset=utf-8'
        };
    }
]);

app.run(["$rootScope",
    ($rootScope) => {
        $rootScope.ref = new Firebase("https://gcci-t-structure-model.firebaseio.com");
        $rootScope.api = new API($rootScope.ref);
    }
]);

app
    .service("utilService", UtilService)
    .service("authService", AuthService)
    .service("userService", UserService)

    .controller("NodeEditorCtrl", NodeEditorCtrl)
    .controller("MainCtrl", MainCtrl)
;