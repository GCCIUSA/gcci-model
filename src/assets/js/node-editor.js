import { GCCIModel } from './model';


export class NodeEditor extends React.Component {
    componentDidMount() {
        $(this.getDOMNode()).modal({
            background: true,
            keyboard: true,
            show: false
        });
    }

    componentWillUnmount() {
        $(this.getDOMNode()).off("hidden");
    }

    handleClick(e) {
        e.stopPropagation();
    }

    render() {
        return (
            <div onClick={this.handleClick} className="modal fade" id="NodeEditor" tabindex="-1" role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal"><span>&times;</span></button>
                            <h4 className="modal-title"></h4>
                        </div>
                        <div className="modal-body">
                            Note Editor
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}