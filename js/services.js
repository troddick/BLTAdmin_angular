//Login
bltApp.factory('LoginService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/login', {}, {
        login: {
            method: 'GET',
            cache: false,
            isArray: false
        }
    });
}]); //end of Login

//AuthService
bltApp.factory('AuthService', function ($cookies) {
    return {
        setCredentials: function (credentials) {
            $cookies.put('username', credentials.username);
            $cookies.put('password', credentials.password);
            $cookies.put('roleId', credentials.roleId);
            $cookies.put('eventId', credentials.eventId);
            $cookies.put('name', credentials.name);
        },
        removeCredentials: function () {
            $cookies.remove('username');
            $cookies.remove('password');
            $cookies.remove('roleId');
            $cookies.remove('eventId');
            $cookies.remove('name');
        },
        isLoggedIn: function () {
            return $cookies.get('username') && $cookies.get('password') ? true : false;
        },
        getUsername: function () {
            return $cookies.get('username');
        },
        getEventId: function () {
            return $cookies.get('eventId');
        },
        getRoleId: function () {
            return $cookies.get('roleId');
        },
        getName: function () {
            return $cookies.get('name');
        }
    };
}); //end of Auth

//Users
bltApp.factory('UserService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/users/:id', {}, {
        query: {
            isArray: false,
            url: config.rootURL + '/users'
        },
        getAll: {
            method: 'GET',
            isArray: true,
            cache: true
        },
        update: {
            method: 'PUT',
            cache: false,
            isArray: false
        },
        create: {
            method: 'POST',
            cache: false,
            isArray: false
        },
        delete: {
            method: 'DELETE',
            cache: false,
            isArray: false
        }
    });
}]); //end of UserService

//Organizations
bltApp.factory('OrganizationService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/organizations', {}, {
        query: {
            isArray: true
        },
        getAll: {
            method: 'GET',
            cache: true,
            transformResponse: function (data, headers) {
                return _.indexBy(JSON.parse(data), 'ORGANIZATION_ID');
            }
        },
        save: {
            method: 'POST',
            cache: false,
            isArray: false
        },
        delete: {
            method: 'DELETE',
            cache: false,
            isArray: false
        }
    });
}]); //end of OrganizationService

//Roles
bltApp.factory('RoleService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/roles', {}, {
        query: {
            isArray: true
        },
        getAll: {
            method: 'GET',
            cache: true,
            transformResponse: function (data, headers) {
                return _.indexBy(JSON.parse(data), 'ROLE_ID');
            }
        },
        save: {
            method: 'POST',
            cache: false,
            isArray: false
        },
        delete: {
            method: 'DELETE',
            cache: false,
            isArray: false
        }
    });
}]); //end of RoleService

//Divisions
bltApp.factory('DivisionService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/divisions', {}, {
        query: {
            isArray: true
        },
        getAll: {
            method: 'GET',
            cache: true,
            transformResponse: function (data, headers) {
                return _.indexBy(JSON.parse(data), 'DIVISION_ID');
            }
        },
        save: {
            method: 'POST',
            cache: false,
            isArray: false
        },
        delete: {
            method: 'DELETE',
            cache: false,
            isArray: false
        }
    });
}]); //end of DivisionService

//EventService
bltApp.factory('EventService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/Events', {}, {
        get: {
            method: 'GET',
            isArray: true
        }
    });
}]); //end of EventService

//AIService
bltApp.factory('AIService', ['$http', function ($http) {
    return {
        get: function () {
            return $http.get(config.rootURL + "/ActiveIngredients?publishedDate=");
        },
        getClasses: function (id) {
            return $http.get(config.rootURL + "/ActiveIngredients/" + id + "/aiClass");
        },
        getProducts: function (id) {
            return $http.get(config.rootURL + "/ActiveIngredients/" + id + "/product?publishedDate=");
        }
    };
}]); //end of AIService


//PULAService
bltApp.factory('PULAService', function ($http, $q, VersionService, LimitationsService) {

    return {
        get: function (params, success) {
            var getPulasFromArcGIS = function () {
                return $http.get(config.BLTMapServerPulaURl);
            }

            var getPulasFromDB = function (params, success) {
                //                if (params) {
                //                    return $http.get(config.pulaURL, params);
                //                } else {
                var promises = [];
                var limitationPromises = [];

                $http.get(config.rootURL + "/PULAs").success(function (pulaList) {
                    for (var i = 0; i < pulaList.length; i++) {

                        //get version information
                        promises.push(VersionService.get(pulaList[i].VERSION_ID));

                        //get limitations
                        limitationPromises.push(LimitationsService.getSimpleLimitations(pulaList[i].PULA_ID, params.date));
                    }
                    $q.all(promises).then(function (versionList) {
                        for (var i = 0; i < pulaList.length; i++) {
                            _.extend(pulaList[i], versionList[i].data);
                        }
                        $q.all(limitationPromises).then(function (limitationList) {
                            for (var i = 0; i < pulaList.length; i++) {
                                pulaList[i].limitations = limitationList[i].data;
                            }
                            success(pulaList);
                        });
                    });

                });
                //}
            }

            var pulaList = [];
            getPulasFromArcGIS().success(function (response) {
                var arcGISPulas = response.features;
                getPulasFromDB(params, function (dbPulas) {
                    var pula, match, shapeId;
                    for (var i = 0; i < arcGISPulas.length; i++) {
                        pula = {};
                        shapeId = arcGISPulas[i].attributes["PULA_111015.PULASHAPEI"];
                        match = _.find(dbPulas, {
                            "PULA_SHAPE_ID": shapeId
                        });
                        if (match) {
                            pula = match;
                            pula.PULASHAPEI = shapeId;
                        } else {
                            pula.PULASHAPEI = shapeId;
                        }
                        pulaList.push(pula);
                    }
                    success(pulaList);

                })

            });
        }
    }
});

//PULAPOIService
bltApp.factory('PULAPOIService', function ($http) {
    return {
        get: function (pulaShapeId, date) {
            return $http.get(config.rootURL + "/PULAs/POI/" + pulaShapeId + "/?publishedDate=" + date.month + "/01/" + date.year);
        },
        updateStatus: function (id, date, status) {
            return $http.get(config.rootURL + "/PULAs/" + id + "/updateStatus?status=" + status + "&statusDate=" + date.month + "/01/" + date.year);
        },
        publish: function (id, date) {
            return $http.get(config.rootURL + "/PULAs/" + id + "/updateStatus?status=PUBLISHED");
        },
        update: function (details) {
            return $http.put(config.rootURL + "/PULAs/" + details.ID, details);
        },
        addComment: function (pula, comment) {
            var comment = "[" + comment.name + "|" + comment.org + "|" + comment.text + "]";
            delete pula.comments;
            pula.COMMENTS = comment;
            return $http.put(config.rootURL + "/PULAs/" + pula.ID + "/AddComments.json", {
                COMMENTS: comment
            });
        },
        post: function (details) {
            return $http.post(config.rootURL + "/PULAs", details);
        }
    };
}); //end of PULAPOIService

//VersionService
bltApp.factory('VersionService', function ($http) {
    return {
        get: function (versionId) {
            return $http.get(config.rootURL + "/Version/" + versionId);
        }
    };
}); //end of VersionService

//SpeciesService
bltApp.factory('SpeciesService', function ($http, $q) {
    return {
        get: function (pulaDetails) {
            return $http.get(config.rootURL + "/ActiveIngredientPULA/" + pulaDetails.PULA_ID + "/Species");
        },
        getAll: function () {
            return $http.get(config.rootURL + "/SimpleSpecies");
        },
        add: function (pulaId, species) {
            return $http.post(config.rootURL + "/PULAs/" + pulaId + "/AddSpeciesToPULA?publishedDate=", species);
        },
        addOrRemove: function (pulaId, speciesList) {

            //add
            var addSpecies = function (species) {
                return $http.post(config.rootURL + "/PULAs/" + pulaId + "/AddSpeciesToPULA?publishedDate=", species);
            };
            //remove
            var removeSpecies = function (species) {
                return $http.post(config.rootURL + "/PULAs/" + pulaId + "/RemoveSpeciesFromPULA?publishedDate=", species);
            };
            var promises = [];
            var addList = [];
            var removeList = [];
            speciesList.forEach(function (species) {
                if (species.status == "new") {
                    addList.push(species);
                } else if (species.status == "delete") {
                    removeList.push(species);
                }

            });
            if (addList.length > 0) {
                promises.push(addSpecies({
                    SPECIES: addList
                }));
            }
            if (removeList.length > 0) {
                promises.push(removeSpecies({
                    SPECIES: removeList
                }));
            }
            return $q.all(promises);
        }
    };
}); //end of SpeciesService

//LimitationsService
bltApp.factory('LimitationsService', function ($http, $q) {
    return {
        get: function (pulaId, date, success) {
            var getProducts = function (id) {
                if (!id) {
                    return null;
                } else {
                    return $http.get(config.rootURL + "/Products?ProductID=" + id + "&publishedDate=");
                }
            }
            var promises = [];
            var limit;
            $http.get(config.rootURL + "/PULAs/" + pulaId + "/PULALimitations?" + "ActiveDate=" + date.month + "/01/" + date.year).success(function (limitations) {
                //product names
                for (var i = 0; i < limitations.length; i++) {
                    limit = limitations[i];
                    promises.push(getProducts(limit.PRODUCT_ID));
                }
                $q.all(promises).then(function (products) {
                    for (var i = 0; i < products.length; i++) {
                        if (products[i]) {
                            limitations[i].PRODUCT_NAME = products[i].data[0].PRODUCT_NAME;
                            limitations[i].PRODUCT_REGISTRATION_NUMBER = products[i].data[0].PRODUCT_REGISTRATION_NUMBER;
                        }
                    }
                    success(limitations);
                });

            });
        },
        getCodes: function (limitationList, date, success) {
            var getCode = function (limitation) {
                return $http.get(config.rootURL + "/Limitations/" + limitation.LIMITATION_ID + "?publishedDate=" + date.month + "/01/" + date.year);
            };
            var promises = [];
            var processedLimitations = {};
            var id;
            limitationList.forEach(function (limitation) {
                id = limitation.LIMITATION_ID;
                if (!processedLimitations[id]) {
                    processedLimitations[id] = true;
                    promises.push(getCode(limitation));
                }
            });
            $q.all(promises).then(function (results) {
                success(results);
            });
        },
        addOrRemove: function (limitationList) {

            //add
            var addLimitation = function (limitation) {
                return $http.post(config.rootURL + "/PULALimitations", limitation);
            };
            //remove
            var removeLimitation = function (limitation) {
                return $http.delete(config.rootURL + "/PULALimitation/" + limitation.PULA_LIMITATION_ID);
            };
            var promises = [];
            limitationList.forEach(function (limitation) {
                if (limitation.status == "new") {
                    promises.push(addLimitation(limitation));
                } else if (limitation.status == "delete") {
                    promises.push(removeLimitation(limitation));
                }

            });

            return $q.all(promises);
        },
        getSimpleLimitations: function (pulaId, date) {
            return $http.get(config.rootURL + "/PULAs/" + pulaId + "/PULALimitations?" + "ActiveDate=" + date)
        }
    };
}); //end of LimitationsService

bltApp.factory('AIClassService', function ($http, $q) {
    return {
        get: function () {
            return $http.get(config.rootURL + "/AIClasses?publishedDate=");
        },
        addToAI: function (aiClassId, ai) {
            ///Products/{entityID}/AddProductToAI
            return $http.post(config.rootURL + "/AIClasses/" + aiClassId + "/AddAIClass", ai);
        },
        removeFromAI: function (aiClassId, ai) {
            return $http.delete(config.rootURL + "/AIClasses/" + aiClassId + "/RemoveAIClassFromAI?activeIngredientID=" + ai.ID, ai);
        },
        addMultipleToAI: function (aiClassList, ai, success) {
            var addToAI = this.addToAI;
            var promises = [];
            if (!aiClassList || aiClassList.length == 0) {
                success();
            }
            angular.forEach(aiClassList, function (aiClass) {
                if (aiClass.status != "delete") {
                    promises.push(addToAI(aiClass.ID, ai));
                }
            });
            $q.all(promises).then(function (results) {
                success();
            });
        },
        addRemoveMultipleAI: function (aiClassList, ai, success) {
            var addToAI = this.addToAI;
            var removeFromAI = this.removeFromAI;
            var promises = [];
            if (!aiClassList || aiClassList.length == 0) {
                success();
            }
            angular.forEach(aiClassList, function (aiClass) {
                if (aiClass.status == "delete") {
                    promises.push(removeFromAI(aiClass.ID, ai));
                } else if (aiClass.status == "new") {
                    promises.push(addToAI(aiClass.ID, ai));
                }
            });
            $q.all(promises).then(function (results) {
                success();
            });
        }
    };
});

//ProductService
bltApp.factory('ProductService', function ($http, $q) {
    return {
        get: function (date, term) {
            return $http.get(config.rootURL + "/Products?publishedDate=" + date + "&term=" + term);
        },
        addToAI: function (prodID, ai) {
            ///Products/{entityID}/AddProductToAI
            return $http.post(config.rootURL + "/Products/" + prodID + "/AddProductToAI", ai);
        },
        removeFromAI: function (prodID, ai) {
            return $http.delete(config.rootURL + "/Products/" + prodID + "/RemoveProductFromAI?activeIngredientID=" + ai.ACTIVE_INGREDIENT_ID);
        },
        addMultipleToAI: function (aiProductList, ai, success) {
            var addToAI = this.addToAI;
            var promises = [];
            if (!aiProductList || aiProductList.length == 0) {
                success();
            }
            angular.forEach(aiProductList, function (aiProduct) {
                if (aiProduct.status != "delete") {
                    promises.push(addToAI(aiProduct.PRODUCT_ID, ai));
                }
            });
            $q.all(promises).then(function (results) {
                success();
            });
        },
        addRemoveMultipleAI: function (aiProductList, ai, success) {
            var addToAI = this.addToAI;
            var removeFromAI = this.removeFromAI;
            var promises = [];
            if (!aiProductList || aiProductList.length == 0) {
                success();
            }
            angular.forEach(aiProductList, function (aiProduct) {
                if (aiProduct.status == "delete") {
                    promises.push(removeFromAI(aiProduct.PRODUCT_ID, ai));
                } else if (aiProduct.status == "new") {
                    promises.push(addToAI(aiProduct.PRODUCT_ID, ai));
                }
            });
            $q.all(promises).then(function (results) {
                success();
            });
        }
    };
});
//end of ProductService

//Parts
bltApp.factory('PartsService', ['$resource', function ($resource) {
    return $resource(config.rootURL + '/:url', {}, {
        query: {
            isArray: true
        },
        getAll: {
            method: 'GET',
            isArray: true,
            url: config.rootURL + '/:url',
            cache: false
        },
        update: {
            method: 'PUT',
            cache: false,
            isArray: false
        },
        create: {
            method: 'POST',
            cache: false,
            isArray: false
        },
        delete: {
            method: 'DELETE',
            cache: false,
            isArray: false
        }
    });
}]); //end of PartsService

//EventPULA
bltApp.factory('EventPULAService', function ($http) {
    return {
        get: function (eventId) {
            return $http.get(config.rootURL + "/Events/" + eventId + "/PULAs");
        }
    };
}); //end of EventPULA