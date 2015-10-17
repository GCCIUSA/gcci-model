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
     * Gets node by given node's id
     * @param id - given node's id
     * @returns {Object} node if found, else undefined
     */
    static getNodeById(id) {
        return this.nodes.find(x => x.id === id);
    }

    static getRefById(id) {
        return this.rootRef.orderByKey().equalTo(id).ref();
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
            if (n.path.substr(0, node.path.length) === node.path && n.depth > node.depth) {
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
        let childPath = target.path + indexToPath(getChildren(target).length + 1);

        this.rootRef.push().set({
            "title": data.title,
            "uid": data.uid,
            "path": childPath,
            "depth": node.depth + 1
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

        if (pos === "first") {
            newNodePath = parentPath + indexToPath(1);
            for (let s of siblings) {
                updatePath(s, shiftPath(s.path, 1));
            }
        }
        else if (pos === "last") {
            newNodePath = parentPath + indexToPath(siblings.length + 1);
        }
        else if (pos === "left" || pos === "right") {
            newNodePath = pos === "left" ? target.path : shiftPath(target.path, 1);
            for (let s of siblings) {
                if (getPathIndex(s.path) >= getPathIndex(newNodePath)) {
                    updatePath(s, shiftPath(s.path, 1));
                }
            }
        }

        if (newNodePath !== "") {
            this.rootRef.push().set({
                "title": data.title,
                "uid": data.uid,
                "path": newNodePath,
                "depth": node.depth
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
                updatePath(s, shiftPath(s.path, -1));
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

    }


    /**
     * Helper
     * Shift given path with specific step
     */
    static shiftPath(path, step) {
        return path.substr(0, path.length - 4) + indexToPath((getPathIndex(path) + step));
    }

    /**
     * Helper
     * Updates the path of the given node and all of its descendants
     */
    static updatePath(node, newPath) {
        let descendants = getDescendants(node);

        for (let d of descendants) {
            let dNewPath = newPath + d.path.substr(node.path.length);
            getRefById(d.id).update({ path: dNewPath, depth: dNewPath / 4});
        }
        getRefById(node.id).update({ path: newPath, depth: newPath / 4 });
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
     * If no depth specified, gets rightmost index
     */
    static getPathIndex(path, depth) {
        if (depth) {
            return parseInt(path.substr((depth - 1) * 4, 4));
        }
        return parseInt(path.substr(path.length - 4));
    }

    /**
     * Helper
     * Converts index to path format
     */
    static indexToPath(index) {
        return (10000 + index).toString().substr(1);
    }
}