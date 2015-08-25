angular.module('spl2jsonApp', ["ngSanitize"])
    .controller("spl2jsonCtrl", ["$scope", "$http", function ($scope, $http) {
        var dictionary = {
            "namespace" : "DEFINE NAMESPACE ",
            "table" : "DEFINE TABLE ",
            "table_namespace" : " NAMESPACE ",
            "terminator" : ";\n\n",
            "indent" : "  ",
            "object" : "DEFINE OBJECT ",
            "namespace_regex" : "DEFINE\\s+NAMESPACE\\s+",
            "table_regex" : "DEFINE\\s+TABLE\\s+",
            "table_namespace_regex" : "\\s+NAMESPACE\\s+",
            "terminator_regex" : ";\\s+",
            "indent_regex" : "\\s\\s",
            "name_regex" : "(\\S+)",
            "object_regex" : "DEFINE\\s+OBJECT\\s+",
            "namespace_description" : "\\s*(.*)"
        };
        var regex = {
            "namespace" : new RegExp("^" + dictionary.namespace_regex + dictionary.name_regex + dictionary.namespace_description),
            "table" : new RegExp("^" + dictionary.table_regex + dictionary.name_regex + dictionary.table_namespace_regex + dictionary.name_regex),
            "object" : new RegExp("^" + dictionary.object_regex + dictionary.name_regex),
            "terminator" : new RegExp(dictionary.terminator_regex)
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
                if(key === "objects") {
                    string += parse_objects(value);
                } else {
                    if(typeof value === "object") {
                        string += dictionary.namespace + key + " " + parse_namespace(key, value);
                    } else {
                        string = "Invalid SPL JSON";
                    }
                }
            }
            return string.trim();
            function parse_namespace(namespace_name, namespace_object) {
                var string = "";
                for(var keys = Object.keys(namespace_object), i = 0, end = keys.length; i < end; i++) {
                    var key = keys[i], value = namespace_object[key];
                    if(key === "NAMESPACE" && value.length > 0) {
                        for(var j = 0; j < value.length; j++) {
                            string += (j>0 ? dictionary.indent : "") + value[j] + "\n";
                        }
                        string += dictionary.terminator;
                    } else if(typeof value === "object") {
                        string += parse_table(namespace_name, key, value);
                    } else {
                        string += "Invalid NAMESPACE object";
                    }
                }
                return string;
            }
            function parse_table(namespace_name, table_name, table_object) {
                var string = "";
                if(table_object.TABLE.length > 0) {
                    string += dictionary.table + table_name + dictionary.table_namespace + namespace_name;
                    for(var j = 0; j < table_object.TABLE.length; j++) {
                        string += (j>0 ? dictionary.indent : "") + table_object.TABLE[j] + "\n";
                    }
                    string += dictionary.terminator;
                } else {
                    string = "Invalid TABLE object";
                }
                return string;
            }
            function parse_objects(objects) {
                var string = "";
                for(var keys = Object.keys(objects), i = 0, end = keys.length; i < end; i++) {
                    var key = keys[i], value = objects[key];
                    string += dictionary.object + key;
                    for(var j = 0; j < value.length; j++) {
                        string += (j>0 ? dictionary.indent : "") + value[j] + "\n";
                    }
                    string += dictionary.terminator;
                }
                return string;
            }
        };
        $scope.string_to_json = function (string) {
            if(string) {
                var json = {};
                var substrings = (clean_string(string)).split(regex.terminator);
                substrings.pop();
                for(var i = 0; i < substrings.length; i++) {
                    if(regex.namespace.test(substrings[i])) {
                        json = substring_to_json("NAMESPACE", substrings[i], json, regex.namespace);
                    } else if (regex.table.test(substrings[i])) {
                        json = substring_to_json("TABLE", substrings[i], json, regex.table);
                    } else if (regex.object.test(substrings[i])) {
                        json = substring_to_json("OBJECT", substrings[i], json, regex.object);
                    } else {
                        console.error("UNKNOWN ENTITY");
                    }
                }
                $scope.spl_json = json;
                $scope.spl_json_display = JSON.stringify($scope.spl_json, undefined, 4);
            } else {
                $scope.spl_json_display = "Invalid Input";
            }
        };
        var substring_to_json = function (type, substring, json, breakdown_regex) {
            var schema = substring.split("\n");
            schema.pop();
            var breakdown = breakdown_regex.exec(schema.shift());
            schema = schema.map(function (item) { return item.trim(); });
            if(breakdown) {
                switch(type) {
                    case "NAMESPACE":
                        json[breakdown[1]] = {
                            "NAMESPACE" : [breakdown[2]].concat(schema)
                        };
                        break;
                    case "TABLE":
                        if(!json[breakdown[2]]) {
                            json[breakdown[2]] = {};
                        }
                        json[breakdown[2]][breakdown[1]] = {
                            "TABLE" : [""].concat(schema)
                        };
                        break;
                    case "OBJECT":
                        if(!json.objects) {
                            json.objects = {};
                        }
                        json.objects[breakdown[1]] = [""].concat(schema);
                        break;
                    default:
                        console.error("UNKNOWN SUBSTRING");
                        break;
                }
            } else {
                //console.log(substring);
                //console.log(schema);
                console.error(type + " REGEX ERROR");
                console.error(breakdown);
            }
            return json;
        };
        var clean_string = function (string) {
            var lines = string.split("\n");
            var clean_string = lines.filter(function (line) {
                return (line[0] === "#");
            });
            return clean_string.join("\n");
        };
    }]);
