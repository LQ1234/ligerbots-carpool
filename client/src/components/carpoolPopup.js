import React, {Component} from "react";
import ParticipantPopup from "./participantPopup"
import {deepClone,flatten,getTextOrReject,api_root} from "../util.js";
import PopupMessage from "./popupMessage";

class CarpoolPopup extends Component {
    constructor(props){
        super(props);
        this.state={
            modified:deepClone(props.carpools[props.id])
        }
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
        if(!this.state.modified.name.trim().length){
            this.props.popupMessageFunctions.showPopupMessage({message:"Name should not be empty.",type:PopupMessage.error});
            return
        }
        let req=flatten({id:this.props.id,...this.state.modified})
        console.log(req);
        fetch(api_root+'edit-carpool', {
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
        if(window.confirm("Are you sure you want to delete this carpool?"))
        fetch(api_root+'delete-carpool', {
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
    participantPressed=()=>{
        this.props.showPopup({
            view: ParticipantPopup,
            id:this.props.carpools[this.props.id].driverId
        });
    }
    render(){
        let driverId=this.props.carpools[this.props.id].driverId;
        let driver=null;
        if(driverId in this.props.participants){
            driver=this.props.participants[driverId];
        }
        return(
            <>
                <div className="popup-wrapper" onClick={this.handleHide}>
                    <div className="popup-container">

                        <div className="title" >
                        Editing Carpool
                        </div>
                        <div className="popup" >
                            <div className="infoGrid">
                                <label><span>Name: </span><input name="name" value={this.state.modified.name} onChange={this.handleCarpoolChange}/></label>
                                <label><span>Origin: </span><input name="origin" value={this.state.modified.origin} onChange={this.handleCarpoolChange}/></label>
                                <label><span>Departing Time: </span><input name="departingTime" value={this.state.modified.departingTime} onChange={this.handleCarpoolChange}/></label>
                                <label><span>Return Time: </span><input name="returningTime" value={this.state.modified.returningTime} onChange={this.handleCarpoolChange}/></label>
                                <label><span>Seats (Including Driver): </span><input type="number" name="seats" value={this.state.modified.seats} onChange={this.handleCarpoolChange}/> </label>
                                <div>
                                    <span>Driver:</span> <span className="imbeddedParticipant" onClick={this.participantPressed}>{driver.personalInformation.name}</span>
                                </div>
                                <label><span>Note: </span><br/><textarea name="note" value={this.state.modified.note} onChange={this.handleCarpoolChange}/></label>
                            </div>

                            <button type="button" name="button" onClick={this.saveClicked}>Save</button>
                            &emsp;
                            <button type="button" name="button" onClick={this.cancelClicked}>Cancel</button>
                            &emsp;
                            <button type="button" name="button" onClick={this.deleteClicked}>Delete</button>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}
export default CarpoolPopup;
