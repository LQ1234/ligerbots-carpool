import React, {Component} from "react";
import CarpoolDropdown from "./carpoolDropdown";
import CarpoolPopup from "./carpoolPopup";
import {deepClone,flatten,getTextOrReject} from "../util.js";

class ParticipantPopup extends Component {
    constructor(props){
        super(props);
        console.log(props.participants,props.id);
        this.state={
            modified:deepClone(props.participants[props.id])
        }
        console.log(this.state);
    }
    handleCarpoolsChange=(isDepartingTrip, updatedCarpoolSelection) => {
        this.setState({
            modified:{
                ...this.state.modified,
                carpool:{
                    ...this.state.modified.carpool,
                    [isDepartingTrip?"departing":"returning"]:updatedCarpoolSelection
                }
            }
        });
    }
    handlePersonalInformationChange=(event) => {
        let target=event.target;
        this.setState({
            modified:{
                ...this.state.modified,
                personalInformation:{
                    ...this.state.modified.personalInformation,
                    [target.name]: target.value
                }
            }
        });
        console.log(this.state);

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
        fetch('api/edit-participant', {
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

        fetch('api/delete-participant', {
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
    carpoolPressed=()=>{
        this.props.showPopup({
            view: CarpoolPopup,
            id:this.props.participants[this.props.id].carpool.drivingCarpool
        });
    }
    render(){
        let drivingCarpoolId=this.props.participants[this.props.id].carpool.drivingCarpool;
        let drivingCarpool=null;
        if(drivingCarpoolId in this.props.carpools){
            drivingCarpool=this.props.carpools[drivingCarpoolId];
        }
        return(
            <>
                <div className="popup-wrapper" onClick={this.handleHide}>
                    <div className="popup" >
                        <div className="infoGrid">
                            <label><span>Name: </span><input name="name" value={this.state.modified.personalInformation.name} onChange={this.handlePersonalInformationChange}/></label>
                            <label><span>Email: </span><input name="email" value={this.state.modified.personalInformation.email} onChange={this.handlePersonalInformationChange}/></label>
                            <label><span>Number: </span><input name="number" value={this.state.modified.personalInformation.number} onChange={this.handlePersonalInformationChange}/></label>
                            <label><span>Note: </span><br/><textarea name="note" value={this.state.modified.personalInformation.note} onChange={this.handlePersonalInformationChange}/></label>
                        </div>
                        {
                            drivingCarpool?
                            <div>
                                Driver for <span className="imbeddedCarpool" onClick={this.carpoolPressed}>{drivingCarpool.name}</span>
                            </div>:
                            <div style={{"marginBottom":".5em"}}>
                                Departing Trip: <CarpoolDropdown includeNewCarpool={false} participants={this.props.participants} isDepartingTrip={true} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.modified.carpool} selectedCarpoolsChangeHandler={this.handleCarpoolsChange}/>
                                &emsp;
                                Returning Trip: <CarpoolDropdown includeNewCarpool={false} participants={this.props.participants} isDepartingTrip={false} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.modified.carpool} selectedCarpoolsChangeHandler={this.handleCarpoolsChange}/>
                            </div>
                        }
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
export default ParticipantPopup;
