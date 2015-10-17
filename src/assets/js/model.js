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
class GCCIModel {
    constructor() {
        this.rootRef = new Firebase("https://gcci-model.firebaseio.com/");
        this.nodes = [];

        this.init();
    }

    init() {
        this.rootRef.on("value", (snapshot) => {
            let nodeObjs = snapshot.val();

            if (nodeObjs !== null) {
                for (let key of Object.keys(nodeObjs)) {
                    let data = nodeObjs[key];
                    data[id] = key;
                    this.nodes.push(data);
                }
            }
        });
    }

    static getTree() {

    }

    /**
     * Gets the children nodes of the given node.
     * @param node - given node
     * @returns {Array} - children nodes
     */
    static getChildren(node) {
        let children = [];

        for (let n of this.nodes) {
            if (getParentPath(n) === node.path) {
                children.push(n);
            }
        }

        return children;
    }

    /**
     * Gets the descendants nodes of the give node.
     * @param node - given node
     * @returns {Array} - descendants nodes
     */
    static getDescendants(node) {
        let descendants = [];

        for (let n of this.nodes) {
            if (getPathAtDepth(n.path, getDepth(node.path)) === node.path && getDepth(n.path) > getDepth(node.path)) {
                descendants.push(n);
            }
        }

        return descendants;
    }

    /**
     * Gets the parent node of the given node.
     * @param node - given node
     * @returns {Object} - parent node
     */
    static getParent(node) {
        let parentPath = getParentPath(node);

        return this.nodes.find(x => x.path === parentPath);
    }

    /**
     * Gets the siblings nodes of the given node.
     * @param node - given node
     * @returns {Array} - siblings nodes
     */
    static getSiblings(node) {
        let siblings = [],
            parentPath = getParentPath(node);

        for (let n of this.nodes) {
            if (parentPath === getParentPath(n)) {
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
     * @param target - target node
     * @param data - new node's data
     */
    static addChild(target, data) {
        let childPath = calcPathAppend(target.path, indexToPath(getChildren(target).length + 1));

        this.rootRef.push().set({
            "title": data.title,
            "uid": data.uid,
            "path": childPath
        });
    }

    /**
     * Adds a new node as a sibling to the target node object.
     * @param target - target node
     * @param pos - possible values are: first, last, left, right
     * @param data - new node's data
     */
    static addSibling(target, pos, data) {
        let [siblings, parentPath, newNodePath] = [
            getSiblings(target),
            getParentPath(target),
            ""
        ];

        // shift target's siblings
        if (pos === "first") {
            newNodePath = calcPathAppend(parentPath, indexToPath(1));
            for (let s of siblings) {
                updatePath(s, calcPathShift(s.path, 1));
            }
        }
        else if (pos === "last") {
            newNodePath = calcPathAppend(parentPath + indexToPath(siblings.length + 1));
        }
        else if (pos === "left" || pos === "right") {
            newNodePath = pos === "left" ? target.path : calcPathShift(target.path, 1);
            for (let s of siblings) {
                if (getPathIndex(s.path) >= getPathIndex(newNodePath)) {
                    updatePath(s, calcPathShift(s.path, 1));
                }
            }
        }

        // insert new node
        if (newNodePath !== "") {
            this.rootRef.push().set({
                "title": data.title,
                "uid": data.uid,
                "path": newNodePath
            });
        }
        else {
            throw "Invalid path";
        }
    }

    /**
     * Removes the given node and all it’s descendants.
     * @param node - given node
     */
    static remove(node) {
        let [descendants, siblings, pathIndex] = [
            getDescendants(node),
            getSiblings(node),
            getPathIndex(node.path)
        ];

        for (let d of descendants) {
            getRefById(d.id).remove();
        }
        getRefById(node.id).remove();

        // update path of its right siblings
        for (let s of siblings) {
            if (getPathIndex(s.path) > pathIndex) {
                updatePath(s, calcPathShift(s.path, -1));
            }
        }
    }

    /**
     * Moves the given node and all it’s descendants to a new position relative to another node.
     * @param node - given node
     * @param target - target node
     * @param pos - possible values are: child, left, right
     */
    static move(node, target, pos) {
        let [oPath, oSiblings] = [
            node.path,
            getSiblings(node)
        ];

        // check if move to an invalid target
        for (let d of getDescendants(node)) {
            if (d.id === target.id) {
                throw "Cannot move node to one of its descendants."
            }
        }

        // insert node to new location
        if (pos === "child") {
            let newPath = calcPathAppend(target.path, indexToPath(getChildren(target).length + 1));
            updatePath(node, newPath);
        }
        else if (pos === "left" || pos === "right") {
            let newPath = pos === "left" ? target.path : calcPathShift(target.path, 1);
            updatePath(node, newPath);

            for (let s of getSiblings(target)) {
                if (getPathIndex(s.path) >= getPathIndex(newNodePath)) {
                    updatePath(s, calcPathShift(s.path, 1));
                }
            }
        }

        // shift node's original location's siblings
        for (let s of oSiblings) {
            if (getPathIndex(s.path) > getPathIndex(oPath)) {
                updatePath(s, calcPathShift(s.path, -1));
            }
        }
    }




    /**
     * Helper
     * Gets node by given node's id.
     * @param id - given node's id
     * @returns {Object} node if found, else undefined
     */
    static getNodeById(id) {
        return this.nodes.find(x => x.id === id);
    }

    /**
     * Helper
     * Gets firebase reference by given node's id.
     * @param id - given node's id
     * @returns {Object} firebase reference if found, else null
     */
    static getRefById(id) {
        return this.rootRef.orderByKey().equalTo(id).ref();
    }

    /**
     * Helper
     * Calculates path by shifting given path with specific step.
     */
    static calcPathShift(path, shift) {
        return path.substr(0, path.length - 4) + indexToPath((getPathIndex(path) + shift));
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
     * Updates the path of the given node and all of its descendants.
     */
    static updatePath(node, newPath) {
        let descendants = getDescendants(node);

        for (let d of descendants) {
            let dNewPath = newPath + d.path.substr(node.path.length);
            getRefById(d.id).update({ path: dNewPath});
        }
        getRefById(node.id).update({ path: newPath });
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