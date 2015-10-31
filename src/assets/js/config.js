import { API } from "../libs/gcci-model/api";
import { UtilService } from "./service";
import { MainCtrl } from "./controller";


let app = angular.module("app", ["ngMaterial"]);

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
        $rootScope.ref = new Firebase("https://gcci-model.firebaseio.com");
        $rootScope.api = new API($rootScope.ref);
    }
]);

app
    .service("utilService", UtilService)
    .controller("MainCtrl", MainCtrl)
;