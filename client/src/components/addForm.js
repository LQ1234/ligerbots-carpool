import React, {Component} from "react";
import CarpoolDropdown from "./carpoolDropdown";
import EventPopup from "./eventPopup";
import {flatten,getTextOrReject,api_root} from "../util.js";
import PopupMessage from "./popupMessage";

class AddForm extends Component {
    constructor(props) {
        super(props);
        this.state={
            carpool:{
                departing: {
                    type: 0,//0 for waitlist, 1 for parent, 2 for new carpool, 3 for existing carpool.
                    carpoolId: 0,
                },
                returning: {
                    type: 0,
                    carpoolId: 0,
                }
            },
            personalInformation:{
                name: "",
                email: "",
                number: "",
                note: ""
            },
            newCarpool:{
                name: "",
                origin: "",
                departingTime: props.events[props.eventId].defaultDepartingTime||"",
                returningTime: props.events[props.eventId].defaultReturningTime||"",
                seats: 4,
                note: "",
                trip: 2,//0 for departing, 1 for returning, 2 for both
            },

        };
    }
    handlePersonalInformationChange=(event) => {
        let target=event.target;
        this.setState({
            personalInformation:{
                ...this.state.personalInformation,
                [target.name]: target.value
            }
        });
    }
    handleNewCarpoolChange=(event) => {
        let target=event.target;
        if(target.name=="seats"){
            let p=parseInt(target.value);
            if(target.value=="")p=0;
            if(isNaN(p))return;
            if(p<1)p=1;
            if(p>200)p=200;
            this.setState({
                newCarpool:{
                    ...this.state.newCarpool,
                    "seats": p
                }
            });
            return;
        }
        if(target.name=="trip"){
            let p=parseInt(target.value);
            this.setState({
                newCarpool:{
                    ...this.state.newCarpool,
                    [target.name]: p
                }
            });
            return;
        }
        this.setState({
            newCarpool:{
                ...this.state.newCarpool,
                [target.name]: target.value
            }
        });
    }
    handleSelectedCarpoolsChange=(isDepartingTrip, updatedCarpoolSelection) => {
        this.setState(state=>({
            ...state,
            carpool:{
                ...state.carpool,
                [isDepartingTrip?"departing":"returning"]:updatedCarpoolSelection
            }
        }));
    }
    handleIsDriverChange=(event)=>{
        let target=event.target;
        this.setState({
            carpool:{
                ...this.state.carpool,
                [target.name]: target.value=="yes"
            }
        });
        if(target.value=="yes"&&this.state.newCarpool.name==""){
            this.setState({
                newCarpool:{
                    ...this.state.newCarpool,
                    name: this.state.personalInformation.name+"'s Carpool"
                }
            });
        }
    }
    addButtonClicked=(e)=>{
        if(!this.state.personalInformation.name.trim().length){
            this.props.popupMessageFunctions.showPopupMessage({message:"Name should not be empty.",type:PopupMessage.error});
            return
        }
        if(this.props.participantType=="carpool" && !this.state.newCarpool.name.trim().length){
            this.props.popupMessageFunctions.showPopupMessage({message:"Carpool Name should not be empty.",type:PopupMessage.error});
            return
        }
        let req=flatten({
            eventId:this.props.eventId,
            personalInformation:this.state.personalInformation,
            carpool:this.state.carpool,
            ...this.state.newCarpool
        });
        req.carpool_isDriver = this.props.participantType=="carpool";
        fetch(api_root+'add-carpool-or-participant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        })
        .then(getTextOrReject)
        .then(data => {
            this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            this.props.goToEvents();
        })
        .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
    }
    eventPressed=()=>{
        this.props.showPopup({
            view: EventPopup,
            newMode: false,
            id:this.props.eventId
        });
    }
    handleHide=(e)=>{
        if(e.currentTarget===e.target){//ensure non child clicked
            this.props.goToEvents();
        }
    }
    render(){
        return(
            <div className="popup-wrapper" onClick={this.handleHide}>
                <div className="popup-container">
                    <div className="title" >
                    New {this.props.participantType=="carpool"?"Carpool":"Passenger"}
                    </div>
                    <div className="popup" >

                        {/*<div className="subtitle">
                            <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Add Participant/Driver to <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
                        </div>*/}
                        <div className="section">
                            <div className="infoGrid">
                                <label><span>Name: </span><input name="name" value={this.state.personalInformation.name} onChange={this.handlePersonalInformationChange}/></label>
                                <label><span>Email: </span><input name="email" value={this.state.personalInformation.email} onChange={this.handlePersonalInformationChange}/></label>
                                <label><span>Number: </span><input name="number" value={this.state.personalInformation.number} onChange={this.handlePersonalInformationChange}/></label>
                                {
                                    this.props.participantType=="passenger"?
                                    <>
                                        <div><span>Departing Trip: </span>  <CarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={true} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.carpool} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/></div>
                                        <div><span>Returning Trip:</span>  <CarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={false} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.carpool} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/></div>
                                    </>
                                    :null
                                }
                                <label><span>Note: </span><br/><textarea name="note" value={this.state.personalInformation.note} onChange={this.handlePersonalInformationChange}/></label>


                                {/*<div>
                                    <label><input type="radio" name="isDriver" checked={!this.state.carpool.isDriver} value="no" onChange={this.handleIsDriverChange}/>Participant</label>
                                    &emsp;
                                    <label><input type="radio" name="isDriver" checked={this.state.carpool.isDriver} value="yes" onChange={this.handleIsDriverChange}/>Driver</label>
                                </div>*/}

                            </div>
                        </div>
                        {
                            this.props.participantType=="carpool"?<>
                                <div className="section">
                                    <div className="infoGrid">
                                        <label><span>Carpool Name: </span><input name="name" value={this.state.newCarpool.name} onChange={this.handleNewCarpoolChange}/></label>
                                        <label><span>Origin: </span><input name="origin" value={this.state.newCarpool.origin} onChange={this.handleNewCarpoolChange}/></label>
                                        <label><span>Departing Time: </span><input name="departingTime" value={this.state.newCarpool.departingTime} onChange={this.handleNewCarpoolChange}/></label>
                                        <label><span>Return Time: </span><input name="returningTime" value={this.state.newCarpool.returningTime} onChange={this.handleNewCarpoolChange}/></label>
                                        <label><span>Seats (Include Driver): </span><input type="number" name="seats" value={this.state.newCarpool.seats} onChange={this.handleNewCarpoolChange}/></label>
                                        <div>
                                            <span>Trip Direction: </span>
                                        </div>
                                        <div className="carpoolChoice">
                                            <label><input type="radio" name="trip" checked={this.state.newCarpool.trip==0} value="0" onChange={this.handleNewCarpoolChange}/>Departing</label>
                                            <label><input type="radio" name="trip" checked={this.state.newCarpool.trip==1} value="1" onChange={this.handleNewCarpoolChange}/>Returning</label>
                                            <label><input type="radio" name="trip" checked={this.state.newCarpool.trip==2} value="2" onChange={this.handleNewCarpoolChange}/>Both</label>
                                        </div>

                                        <label><span>Carpool Note: </span><br/><textarea name="note" value={this.state.newCarpool.note} onChange={this.handleNewCarpoolChange}/></label>
                                    </div>
                                </div>
                            </>:null
                        }
                        <br/>
                        <button type="button" name="button" onClick={this.addButtonClicked}>Add</button>
                        &emsp;
                        <button type="button" name="button" onClick={this.props.goToEvents}>Cancel</button>

                    </div>
                </div>
            </div>

        );
    }
}
export default AddForm;
