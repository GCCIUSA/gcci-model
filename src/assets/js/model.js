class Tree {
    constructor() {

    }

    addNode(node) {

    }

    addNode(node) {

    }
}

class Node {
    constructor(name, leader) {
        this.name = name;
        this.leader = leader;
        this.parent = null;
        this.children = [];
    }

    addChild(name, leader) {
        let child = new Node(name, leader);
        child.parent = this;
        this.children.push(child);
    }
}