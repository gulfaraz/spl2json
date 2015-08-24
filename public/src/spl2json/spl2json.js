angular.module('spl2jsonApp', ["ngSanitize"])
    .controller("spl2jsonCtrl", ["$scope", "$http", function ($scope, $http) {
        var dictionary = {
            "root" : "/",
            "terminator" : "\n",
            "heritage" : " -- ",
            "value" : " - "
        };
        $http.get("stat/init.json").then(function (spl_json) {
            $scope.spl_json = spl_json.data;
            $scope.spl_json_display = JSON.stringify(spl_json.data, undefined, 4);
            $scope.spl_string = json_to_string(dictionary.root, $scope.spl_json);
        });
        var json_to_string = function (root, json) {
            var string = "";
            for(var keys = Object.keys(json), i = 0, end = keys.length; i < end; i++) {
                var key = keys[i], value = json[key];
                if(typeof value === "object") {
                    string += json_to_string(root + dictionary.heritage + key, value);
                } else {
                    string += ((root === dictionary.root) ? "" : dictionary.terminator) + root + dictionary.heritage + key;
                    string += dictionary.value + value;
                }
            }
            return string;
        };
        $scope.string_to_json = function (string) {
            if(string) {
                var json = {};
                var temp = string.split(dictionary.terminator);
                for(var i = 0; i < temp.length; i++) {
                    temp[i] = temp[i].split(dictionary.root + dictionary.heritage);
                    angular.merge(json, array_to_object(temp[i][1].split(dictionary.heritage)));
                }
                $scope.spl_json = json;
                $scope.spl_json_display = JSON.stringify($scope.spl_json, undefined, 4);
            } else {
                $scope.spl_json_display = "Invalid Input";
            }
        };
        var array_to_object = function (array) {
            var object = {};
            if(array.length === 1) {
                var temp = array[0].split(dictionary.value);
                object[temp[0]] = temp[1];
            } else {
                while(array.length > 1) {
                    var key = array.shift();
                    object[key] = array_to_object(array);
                }
            }
            return object;
        };
    }]);
