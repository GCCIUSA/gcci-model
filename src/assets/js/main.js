import { GCCIModel } from './model';

let model = new GCCIModel();

class Tree extends React.Component {
    addChild(target) {
        console.log(target);
    }

    addSibling(target, pos) {
        console.log(target);
    }

    NodeRowStyle(node) {
        return {
            marginLeft: (GCCIModel.getDepth(node.path) - 1) * 30
        };
    }

    render() {
        let nodeRow = this.props.data.map((node) => {
            return (
                <div  onClick={this.addChild.bind(this, node)} style={this.NodeRowStyle(node)} className="node-row">
                    <i className="glyphicon glyphicon-option-vertical"></i>
                    <span className="node-title">{node.title}</span>
                </div>
            );
        });

        return (
            <div className="model-tree">{nodeRow}</div>
        );
    }
}



document.addEventListener("GCCIMODEL_READY", () => {
    React.render(
        <Tree data={model.getTree()}/>,
        document.getElementById("mainContainer")
    );
});