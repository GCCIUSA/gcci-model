/**
 * GCCI Model API
 *
 * @class API
 */
export class API {
    constructor(ref) {
        this.ref = ref;
    }

    /**
     * Retrieves node object by id.
     *
     * @method getNodeById
     * @param id node id.
     * @returns {Promise} node object.
     */
    getNodeById(id) {
        let deferred = $.Deferred();

        this.ref.orderByKey().equalTo(id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.val());
        });

        return deferred.promise();
    }

    /**
     * Retrieves node object by path.
     *
     * @method getNodeByPath
     * @param path node path.
     * @returns {Promise} node object.
     */
    getNodeByPath(path) {
        let deferred = $.Deferred();

        this.ref.orderByChild("path").equalTo(path).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.val());
        });

        return deferred.promise();
    }

    /**
     * Retrieves firebase reference of node object
     *
     * @method getNodeRef
     * @param node node object.
     * @returns {Object} firebase reference.
     */
    getNodeRef(node) {
        return this.ref.child(node.id);
    }

    /**
     * Retrieves an array of node objects ordered as DFS.
     *
     * @method getTree
     * @returns {Promise} array of node objects.
     */
    getTree() {
        let deferred = $.Deferred();

        this.ref.orderByChild("path").once("value", (snapshot) => {
            let parsed = this._parse(snapshot.val());
            this._sort(parsed);

            deferred.resolve(parsed);
        });

        return deferred.promise();
    }

    /**
     * Retrieves parent node object of node object.
     *
     * @method getParent
     * @param node - node object.
     * @returns {Promise} parent node object.
     */
    getParent(node) {
        let deferred = $.Deferred();

        if (this._isRoot(node)) {
            deferred.resolve(null);
        }
        else {
            this.ref.orderByChild("path").equalTo(this._calcParentPath(node)).once("child_added", (snapshot) => {
                deferred.resolve(snapshot.val());
            });
        }

        return deferred.promise();
    }

    /**
     *
     * Retrieves an array of children of node object.
     *
     * @method getChildren
     * @param node node object.
     * @returns {Promise} array of children.
     */
    getChildren(node) {
        let deferred = $.Deferred();

        this.ref.orderByChild("depth").equalTo(node.depth + 1).once("value", (snapshot) => {
            let children = [], parsed = this._parse(snapshot.val());
            for (let item of parsed) {
                if (item.path.substr(0, node.path.length) === node.path) {
                    children.push(item);
                }
            }
            this._sort(children);

            deferred.resolve(children);
        });

        return deferred.promise();
    }

    /**
     * Retrieves an array of descendants of node object.
     *
     * @method getDescendants
     * @param node node object.
     * @returns {Promise} array of descendants
     */
    getDescendants(node) {
        let deferred = $.Deferred();

        this.ref.orderByChild("depth").startAt(node.depth + 1).once("value", (snapshot) => {
            let descendants = [], parsed = this._parse(snapshot.val());
            for (let item of parsed) {
                if (item.path.substr(0, node.path.length) === node.path) {
                    descendants.push(item);
                }
            }
            this._sort(descendants);

            deferred.resolve(descendants);
        });

        return deferred.promise();
    }

    /**
     * Retrieves an array of siblings of node object.
     *
     * @method getSiblings
     * @param node node object.
     * @returns {Promise} array of siblings
     */
    getSiblings(node) {
        let deferred = $.Deferred();

        this.ref.orderByChild("depth").equalTo(node.depth).once("value", (snapshot) => {
            let siblings = [], parsed = this._parse(snapshot.val());
            for (let item of parsed) {
                if (this._calcParentPath(item) === this._calcParentPath(node)) {
                    siblings.push(item);
                }
            }
            this._sort(siblings);

            deferred.resolve(siblings);
        });

        return deferred.promise();
    }

    /**
     * Checks if give node is a root node.
     *
     * @method _isRoot
     * @param node give node.
     * @returns {boolean} true if is root, else false.
     * @private
     */
    _isRoot(node) {
        return node.depth === 1;
    }

    /**
     * Calculates parent node's path of given node.
     *
     * @method _calcParentPath
     * @param node given node.
     * @returns {*} parent node's path, null if give node is root node.
     * @private
     */
    _calcParentPath(node) {
        if (this._isRoot(node)) {
            return null;
        }
        return node.path.substr(0, node.path.length - 4);
    }

    /**
     * Parses firebase snapshot object into an array of node objects.
     *
     * @method _parse
     * @param snapshotVal firebase snapshot object.
     * @returns {Array} node objects.
     * @private
     */
    _parse(snapshotVal) {
        let parsed = [];

        if (snapshotVal) {
            for (let key of Object.keys(snapshotVal)) {
                let obj = snapshotVal[key];
                obj["id"] = key;
                parsed.push(obj);
            }
        }

        return parsed;
    }

    /**
     * Sorts an array of node objects by a property of node object.
     *
     * @method _sort
     * @param nodes array of node objects.
     * @param prop property of node object.
     * @private
     */
    _sort(nodes, prop = "path") {
        nodes.sort((a, b) => {
            return a[prop].localeCompare(b[prop]);
        });
    }
}