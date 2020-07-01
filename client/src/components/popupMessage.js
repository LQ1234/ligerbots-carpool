import React, {Component} from "react";

class PopupMessage extends Component {
    static error=0;
    static message=1;
    static warning=2;
    constructor(props){
        super(props);
    }
    render(){
        return(
        <div className={"overlayMessage"+(this.props.type==PopupMessage.error?" error":" message")}>
            <div>
                {this.props.message}
            </div>
            <button className="closeButton" onClick={this.props.hidePopupMessage}>X</button>
        </div>);
    }
}
export default PopupMessage;
