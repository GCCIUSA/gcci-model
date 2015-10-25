/**
 * GCCI Model API
 *
 * @class API
 */
class API {
    constructor(ref) {
        this.ref = ref;
    }

    getNode(id) {
        let deferred = $.Deferred();

        this.ref.orderByKey().equalTo(id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.val());
        });

        return deferred.promise();
    }

    getNodeRef(node) {
        let deferred = $.Deferred();

        this.ref.orderByKey().equalTo(node.id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.ref());
        });

        return deferred.promise();
    }

    getTree() {
        let deferred = $.Deferred();

        this.ref.orderByChild("path").once("value", (snapshot) => {
            let parsed = this._parse(snapshot.val());
            this._sort(parsed);

            deferred.resolve(parsed);
        });

        return deferred.promise();
    }

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
     * @param snapshotVal firebase snapshot object.
     * @returns {Array} node objects.
     * @private
     */
    _parse(snapshotVal) {
        let parsed = [];

        for (let key of Object.keys(snapshotVal)) {
            let obj = snapshotVal[key];
            obj["id"] = key;
            parsed.push(obj);
        }

        return parsed;
    }

    /**
     * Sorts an array of node objects by a property of node object.
     *
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