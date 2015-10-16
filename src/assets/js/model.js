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
                    this.nodes.push(nodeObjs[key]);
                }
            }

            this.rootRef.off("value");
        });
    }

    static getNodeById(id) {
        return this.nodes.find(x => x.id === id);
    }

    static getChildren(node) {
        let children = [];

        for (let n of this.nodes) {
            if (getParentPath(n) === node.path) {
                children.push(n);
            }
        }

        return children;
    }

    static getDescendants(node) {
        let descendants = [];

        for (let n of this.nodes) {
            if (n.path.substr(0, node.path.length) === node.path) {
                descendants.push(n);
            }
        }

        return descendants;
    }

    /**
     * Gets the parent node of the given node.
     */
    static getParent(node) {
        let parentPath = getParentPath(node);

        return this.nodes.find(x => x.path === parentPath);
    }

    /**
     * Gets the sibling nodes of the given node.
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
     */
    static addChild(node, data) {
        let childPath = node.path + indexToString(getChildren(node).length + 1);

        this.rootRef.push().set({
            "title": data.title,
            "uid": data.uid,
            "path": childPath,
            "depth": node.depth + 1
        });
    }

    /**
     * Adds a new node as a sibling to the given node object.
     * possible values of pos: 'first', 'last', 'left', 'right'
     */
    static addSibling(node, pos, data) {
        let siblings = getSiblings(node),
            parentPath = getParentPath(node),
            siblingPath = "";

        if (pos === "first") {
            siblingPath = parentPath + indexToString(1);
        }
        else if (pos === "last") {
            siblingPath = parentPath + indexToString(siblings.length + 1);
        }
        else if (pos === "left") {
            siblingPath = node.path;
        }
        else if (pos === "right") {
            siblingPath = parentPath +  indexToString(getPathIndex(node.path) + 1);
        }

        if (siblingPath !== "") {
            this.rootRef.push().set({
                "title": data.title,
                "uid": data.uid,
                "path": siblingPath,
                "depth": node.depth
            });
        }
        else {
            throw "Invalid path";
        }
    }

    static removeNode(id) {

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
     * If no depth specified, gets, rightmost index
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
    static indexToString(index) {
        return (10000 + index).toString().substr(1);
    }
}