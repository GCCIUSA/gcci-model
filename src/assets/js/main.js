import { GCCIModel } from './model';
import { NodeEditor } from './node-editor';
import { Tree } from './tree';


let model = new GCCIModel();

document.addEventListener("GCCIMODEL_READY", () => {
    React.render(
        <Tree model={model}/>,
        document.getElementById("mainContainer")
    );
});