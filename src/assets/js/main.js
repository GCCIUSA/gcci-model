import { GCCIModel } from './model';

var Tree = React.createClass({
    addChild: function (node) {
        console.log(node);
    },

    render: function() {
        let node = this.props.data.map((n) => {
            return (
                <div onClick={this.addChild(n)}>
                    {n.title}<hr/>
                </div>
            );
        });

        return (
            <div className="Tree">{node}</div>
        )
    }
});

let model = new GCCIModel();

document.addEventListener("GCCIMODEL_READY", function () {
    let data = model.getTree();
    React.render(
        <Tree data={data}/>,
        document.getElementById("mainContainer")
    );
});