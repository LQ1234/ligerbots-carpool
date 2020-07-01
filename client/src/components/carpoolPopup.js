import React, {Component} from "react";
import {deepClone,flatten,getTextOrReject} from "../util.js";

class CarpoolPopup extends Component {
    constructor(props){
        super(props);
        console.log(props.participants,props.id);
        this.state={
            modified:deepClone(props.carpools[props.id])
        }
        console.log(this.state);
    }
    handleCarpoolChange=(event) => {
        let target=event.target;
        if(target.name=="seats"){
            let p=parseInt(target.value);
            if(target.value=="")p=0;
            if(isNaN(p))return;
            if(p<1)p=1;
            if(p>200)p=200;
            this.setState({
                modified:{
                    ...this.state.modified,
                    "seats": p
                }
            });
            return;
        }
        this.setState({
            modified:{
                ...this.state.modified,
                [target.name]: target.value
            }
        });
    }
    handleHide=(e)=>{
        if(e.currentTarget===e.target){//ensure non child clicked
            this.cancelClicked();
        }
    }
    cancelClicked=()=>{
        this.props.hidePopup();
    }
    saveClicked=()=>{
        let req=flatten({id:this.props.id,...this.state.modified})
        console.log(req);
        fetch('api/edit-carpool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        })
        .then(getTextOrReject)
        .then(data => {
            this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            this.cancelClicked();
        })
        .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
    }
    deleteClicked=()=>{
        let req=flatten({id:this.props.id})

        fetch('api/delete-carpool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        })
        .then(getTextOrReject)
        .then(data => {
            this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            this.cancelClicked();
        })
        .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
    }
    render(){
        return(
            <>
                <div className="popup-wrapper" onClick={this.handleHide}>
                    <div className="popup" >
                        <div className="infoGrid">
                            <label><span>Name: </span><input name="name" value={this.state.modified.name} onChange={this.handleCarpoolChange}/></label>
                            <label><span>Origin: </span><input name="origin" value={this.state.modified.origin} onChange={this.handleCarpoolChange}/></label>
                            <label><span>Departing Time: </span><input name="departingTime" value={this.state.modified.departingTime} onChange={this.handleCarpoolChange}/></label>
                            <label><span>Return Time: </span><input name="returningTime" value={this.state.modified.returningTime} onChange={this.handleCarpoolChange}/></label>
                            <label><span>Seats: </span><input type="number" name="seats" value={this.state.modified.seats} onChange={this.handleCarpoolChange}/>  (Include Driver)</label>
                            <label><span>Note: </span><br/><textarea name="note" value={this.state.modified.note} onChange={this.handleCarpoolChange}/></label>
                        </div>
                        <button type="button" name="button" onClick={this.saveClicked}>Save</button>
                        &emsp;
                        <button type="button" name="button" onClick={this.cancelClicked}>Cancel</button>
                        &emsp;
                        <button type="button" name="button" onClick={this.deleteClicked}>Delete</button>
                    </div>
                </div>
            </>
        )
    }
}
export default CarpoolPopup;
