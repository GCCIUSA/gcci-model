/**
 * ------------------------------------------
 * Name:    GCCI Model Script
 * Version: 1.0.0
 * Author:  PZ
 * Date:    2015-10-15
 * ------------------------------------------
 *
 * Change Log:
 *
 * 1.0.0 (2015-10-15)
 * - added basic model structure
 */

/**
 * GCCI Model
 *
 * @class GCCIModel
 */
export class GCCIModel {
    constructor() {
        // defines errors
        this.errors = {
            "NOT_READY": new Error("GCCIModel is not ready. Listen for 'GCCIMODEL_READY' event on 'document' object."),
            "INVALID_MOVE": new Error("Cannot move node to one of its descendants.")
        };

        // defines firebase root reference
        this.rootRef = new Firebase("https://gcci-model.firebaseio.com/");
    }

    static parse(snapshotVal) {
        let parsed = [];

        for (let key of Object.keys(snapshotVal)) {
            let obj = snapshotVal[key];
            obj["id"] = key;
            parsed.push(obj);
        }

        return parsed;
    }

    /**
     * Gets node by given node's id.
     *
     * @param id - given node's id
     * @returns {Promise} node if found, else null
     */
    getNodeById(id) {
        let deferred = $.Deferred();

        this.rootRef.orderByKey().equalTo(id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.val());
        });

        return deferred.promise();
    }

    /**
     * Gets firebase reference by given node's id.
     *
     * @param id - given node's id
     * @returns {Promise} firebase reference if found, else null
     */
    getRefById(id) {
        let deferred = $.Deferred();

        this.rootRef.orderByKey().equalTo(id).once("child_added", (snapshot) => {
            deferred.resolve(snapshot.ref());
        });

        return deferred.promise();
    }

    /**
     * Gets tree data structure with DFS.
     *
     * @method getTree
     * @return {Array} an array of nodes
     */
    getTree() {
        let deferred = $.Deferred();

        this.rootRef.once("value", (snapshot) => {
            deferred.resolve(GCCIModel.dfs(GCCIModel.parse(snapshot.val())));
        });

        return deferred.promise();
    }

    /**
     * Gets the children nodes of the given node.
     *
     * @method getChildren
     * @param {Object} node given node
     * @returns {Array} children nodes
     */
    getChildren(node) {
        let deferred = $.Deferred();

        this.rootRef.orderByChild("path").startAt(node.path).once("value", (snapshot) => {
            let children = [];
            for (let n of GCCIModel.parse(snapshot.val())) {
                if (n.depth === node.depth + 1) {
                    children.push(n);
                }
            }
            children.sort((a, b) => a.path.localeCompare(b.path));
            deferred.resolve(children);
        });

        return deferred.promise();
    }

    /**
     * Gets the descendants nodes of the give node.
     *
     * @method getDescendants
     * @param {Object} node given node
     * @returns {Array} descendants nodes
     */
    getDescendants(node) {
        let descendants = [];

        for (let n of this.nodes) {
            if (GCCIModel.getPathAtDepth(n.path, GCCIModel.getDepth(node.path)) === node.path &&
                GCCIModel.getDepth(n.path) > GCCIModel.getDepth(node.path)) {
                descendants.push(n);
            }
        }

        return descendants;
    }

    /**
     * Gets the parent node of the given node.
     *
     * @method getParent
     * @param {Object} node given node
     * @returns {Object} parent node
     */
    getParent(node) {
        let parentPath = GCCIModel.getParentPath(node);

        return this.nodes.find(x => x.path === parentPath);
    }

    /**
     * Gets the siblings nodes of the given node.
     *
     * @method getSiblings
     * @param {Object} node given node
     * @returns {Array} siblings nodes
     */
    getSiblings(node) {
        let siblings = [],
            parentPath = GCCIModel.getParentPath(node);

        for (let n of this.nodes) {
            if (parentPath === GCCIModel.getParentPath(n) && n.id !== node.id) {
                siblings.push(n);
            }
        }
        siblings.sort((a, b) => a.path.localeCompare(b.path));

        return siblings;
    }

    /**
     * Adds a new node as a child to the given node.
     * The new node will be the new rightmost child.
     * If you want to insert a node at a specific position, use the addSibling() method.
     *
     * @method addChild
     * @param {Object} target target node
     * @param {Object} data new node's data
     */
    addChild(target, data) {
        let deferred = $.Deferred();

        let childPath = GCCIModel.calcPathAppend(target.path, GCCIModel.indexToPath(target.numChild + 1));
        this.rootRef.push({
            "title": data.title,
            "uid": data.uid,
            "path": childPath,
            "depth": GCCIModel.getDepth(childPath),
            "numChild": 0
        }, (error) => {
            if (error) {
                deferred.reject(error);
            }
            else {
                deferred.resolve();
            }
        });

        return deferred.promise();
    }

    /**
     * Adds a new node as a sibling to the target node object.
     *
     * @method addSibling
     * @param {Object} target target node
     * @param {String} pos possible values are: first, last, left, right
     * @param {Object} data new node's data
     */
    addSibling(target, pos, data) {
        let [siblings, parentPath, newNodePath] = [
            this.getSiblings(target),
            GCCIModel.getParentPath(target),
            ""
        ];

        // shift target's siblings
        if (pos === "first") {
            newNodePath = GCCIModel.calcPathAppend(parentPath, GCCIModel.indexToPath(1));
            for (let s of siblings) {
                this.updatePath(s, GCCIModel.calcPathShift(s.path, 1));
            }
        }
        else if (pos === "last") {
            newNodePath = GCCIModel.calcPathAppend(parentPath + GCCIModel.indexToPath(siblings.length + 1));
        }
        else if (pos === "left" || pos === "right") {
            newNodePath = pos === "left" ? target.path : GCCIModel.calcPathShift(target.path, 1);
            for (let s of siblings) {
                if (GCCIModel.getPathIndex(s.path) >= GCCIModel.getPathIndex(newNodePath)) {
                    this.updatePath(s, GCCIModel.calcPathShift(s.path, 1));
                }
            }
        }

        // insert new node
        if (newNodePath !== "") {
            this.rootRef.push({
                "title": data.title,
                "uid": data.uid,
                "path": newNodePath,
                "depth": GCCIModel.getDepth(newNodePath)
            });
        }
        else {
            throw "Invalid path";
        }
    }

    /**
     * Removes the given node and all its descendants.
     *
     * @method remove
     * @param {Object} node given node
     */
    remove(node) {
        let [descendants, siblings, pathIndex] = [
            this.getDescendants(node),
            this.getSiblings(node),
            GCCIModel.getPathIndex(node.path)
        ];

        for (let d of descendants) {
            this.getRefById(d.id).remove();
        }
        this.getRefById(node.id).remove();

        // update path of its right siblings
        for (let s of siblings) {
            if (GCCIModel.getPathIndex(s.path) > pathIndex) {
                this.updatePath(s, GCCIModel.calcPathShift(s.path, -1));
            }
        }
    }

    /**
     * Moves the given node and all its descendants to a new position relative to another node.
     *
     * @method move
     * @param {Object} node given node
     * @param {Object} target target node
     * @param {String} pos possible values are: child, left, right
     */
    move(node, target, pos) {
        let [oPath, oSiblings] = [
            node.path,
            this.getSiblings(node)
        ];

        // check if move to an invalid target
        for (let d of this.getDescendants(node)) {
            if (d.id === target.id) {
                throw this.errors.INVALID_MOVE;
            }
        }

        // insert node to new location
        if (pos === "child") {
            let newPath = GCCIModel.calcPathAppend(target.path, GCCIModel.indexToPath(this.getChildren(target).length + 1));
            this.updatePath(node, newPath);
        }
        else if (pos === "left" || pos === "right") {
            let newPath = pos === "left" ? target.path : GCCIModel.calcPathShift(target.path, 1);
            this.updatePath(node, newPath);

            for (let s of this.getSiblings(target)) {
                if (GCCIModel.getPathIndex(s.path) >= GCCIModel.getPathIndex(newNodePath)) {
                    this.updatePath(s, GCCIModel.calcPathShift(s.path, 1));
                }
            }
        }

        // shift node's original location's siblings
        for (let s of oSiblings) {
            if (GCCIModel.getPathIndex(s.path) > GCCIModel.getPathIndex(oPath)) {
                this.updatePath(s, GCCIModel.calcPathShift(s.path, -1));
            }
        }
    }

    /**
     * Depth First Search
     * This is not a public API, do not call this directly.
     */
    static dfs(nodes, node, list = []) {
        if (!node) {
            node = nodes[0];
        }

        list.push(node);

        let children = [];
        for (let n of nodes) {
            if (n.depth === node.depth + 1 && GCCIModel.getParentPath(n) === node.path) {
                children.push(n);
            }
        }
        children.sort((a, b) => a.path.localeCompare(b.path));

        for (let n of children) {
            GCCIModel.dfs(nodes, n, list);
        }

        return list;
    }

    /**
     * Updates the path of the given node and all of its descendants.
     * This is not a public API, do not call this directly.
     */
    updatePath(node, newPath) {
        let descendants = getDescendants(node);

        for (let d of descendants) {
            let dNewPath = newPath + d.path.substr(node.path.length);
            this.getRefById(d.id).update({ path: dNewPath});
        }
        this.getRefById(node.id).update({ path: newPath });
    }




    /**
     * Helper
     * Calculates path by shifting given path with specific step.
     */
    static calcPathShift(path, shift) {
        return path.substr(0, path.length - 4) + GCCIModel.indexToPath((GCCIModel.getPathIndex(path) + shift));
    }

    /**
     * Helper
     * Calculates path by appending a path to a given one.
     */
    static calcPathAppend(path, append) {
        return path + append;
    }

    /**
     * Helper
     * Gets depth of given path.
     */
    static getDepth(path) {
        return path.length / 4;
    }

    /**
     * Helper
     * Gets path at a depth.
     */
    static getPathAtDepth(path, depth) {
        return path.substr(0, depth * 4);
    }

    /**
     * Helper
     * Gets parent's path value of the given node.
     */
    static getParentPath(node) {
        return node.path.substr(0, node.path.length - 4);
    }

    /**
     * Helper
     * Gets index at given depth.
     * If no depth specified, gets rightmost index.
     */
    static getPathIndex(path, depth) {
        if (depth) {
            return parseInt(path.substr((depth - 1) * 4, 4));
        }
        return parseInt(path.substr(path.length - 4));
    }

    /**
     * Helper
     * Converts index to path format.
     */
    static indexToPath(index) {
        return (10000 + index).toString().substr(1);
    }
}