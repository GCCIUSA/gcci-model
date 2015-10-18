import { GCCIModel } from './model';

var Para = React.createClass({
    render: function () {
        var node = this.props.data.map(function (para) {
            return (
                <div>
                    {para.title}<hr/>
                </div>
            );
        });

        return (
            <div className="Para">{node}</div>
        )
    }
});

let model = new GCCIModel();

setTimeout(() => {
    let data = model.getTree();
    React.render(
        <Para data={data}/>,
        document.getElementById("mainContainer")
    );
}, 2000);

