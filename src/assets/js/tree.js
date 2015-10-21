import { GCCIModel } from './model';
import { NodeEditor } from './node-editor';


export class Tree extends React.Component {
    constructor(props) {
        super(props);

        this.moveNode = null;
    }

    addChild(target) {
        $(this.refs.payload.getDOMNode()).modal();
    }

    addSibling(target, position) {
        console.log("add sibling " + position);
    }

    move(node) {
        console.log("move");
    }

    moveTo(target, position) {

    }

    NodeRowStyle(node) {
        return {
            marginLeft: (GCCIModel.getDepth(node.path) - 1) * 30
        };
    }

    render() {
        let nodeRow = this.props.model.getTree().map((node) => {
            return (
                <div style={this.NodeRowStyle(node)} className="node-row">
                    <div className="dropdown pull-left">
                        <a className="dropdown-toggle menu-action-icon action-handle" data-toggle="dropdown">
                            <i className="glyphicon glyphicon-option-vertical"></i>
                        </a>
                        <ul className="dropdown-menu">
                            <li>
                                <a onClick={this.addSibling.bind(this, node, "left")}>
                                    <i className="glyphicon glyphicon-menu-up"></i> &nbsp; add sibling above
                                </a>
                            </li>
                            <li>
                                <a onClick={this.addSibling.bind(this, node, "right")}>
                                    <i className="glyphicon glyphicon-menu-down"></i> &nbsp; add sibling below
                                </a>
                            </li>
                            <li>
                                <a onClick={this.addChild.bind(this, node)}>
                                    <i className="glyphicon glyphicon-arrow-right rotate45"></i> &nbsp; add child
                                </a>
                            </li>
                            <li>
                                <a onClick={this.move.bind(this.node)}>
                                    <i class="glyphicon glyphicon-move"></i> &nbsp; move
                                </a>
                            </li>
                        </ul>
                    </div>

                    <span className="node-title">{node.title}</span>
                </div>
            );
        });

        return (
            <div>
                <div className="model-tree">{nodeRow}</div>
                <NodeEditor header="My Modal New Header"/>
            </div>
        );
    }
}