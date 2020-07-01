import React, {Component} from "react";
import CarpoolDropdown from "./carpoolDropdown";
import EventPopup from "./eventPopup";
import {flatten,getTextOrReject} from "../util.js";

class AddForm extends Component {
    constructor(props) {
        super(props);
        this.state={
            selectedCarpools:{
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
                departingTime: "",
                returningTime: "",
                seats: 4,
                note: ""
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
            selectedCarpools:{
                ...state.selectedCarpools,
                [isDepartingTrip?"departing":"returning"]:updatedCarpoolSelection
            }
        }));
        console.log("updatedCarpoolSelection.type",updatedCarpoolSelection.type)
        if(updatedCarpoolSelection.type==2&&this.state.newCarpool.name==""){
            this.state.newCarpool.name=this.state.personalInformation.name+"'s Carpool"
        }
    }
    addButtonClicked=(e)=>{
        let req=flatten({
            eventId:this.props.eventId,
            personalInformation:this.state.personalInformation,
            carpool:this.state.selectedCarpools,
            ...this.state.newCarpool
        });
        console.log("req",req);
        fetch('api/add-carpool-or-participant', {
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
    render(){
        let newCarpoolEnabled=this.state.selectedCarpools.departing.type==2||this.state.selectedCarpools.returning.type==2;
        return(
            <>
                <div className="subtitle">
                    <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Add Participant/Carpool to <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
                </div>
                <div className="sectiontitle">
                    Information
                </div>
                <div className="section">
                    <div className="infoGrid">
                        <label><span>Name: </span><input name="name" value={this.state.personalInformation.name} onChange={this.handlePersonalInformationChange}/></label>
                        <label><span>Email: </span><input name="email" value={this.state.personalInformation.email} onChange={this.handlePersonalInformationChange}/></label>
                        <label><span>Number: </span><input name="number" value={this.state.personalInformation.number} onChange={this.handlePersonalInformationChange}/></label>
                        <label><span>Note: </span><br/><textarea name="note" value={this.state.personalInformation.note} onChange={this.handlePersonalInformationChange}/></label>
                    </div>
                </div>
                <div className="sectiontitle">
                    Carpool
                </div>
                <div className="section">
                    Departing Trip: <CarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={true} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.selectedCarpools} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/>
                    &emsp;
                    Returning Trip: <CarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={false} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.selectedCarpools} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/>
                </div>
                <br/>
                <div className="sectiontitle">
                    New Carpool
                </div>
                <div className="section">
                    <div className="infoGrid">
                        <label><span>Name: </span><input disabled={!newCarpoolEnabled} name="name" value={this.state.newCarpool.name} onChange={this.handleNewCarpoolChange}/></label>
                        <label><span>Origin: </span><input disabled={!newCarpoolEnabled} name="origin" value={this.state.newCarpool.origin} onChange={this.handleNewCarpoolChange}/></label>
                        <label><span>Departing Time: </span><input disabled={!newCarpoolEnabled} name="departingTime" value={this.state.newCarpool.departingTime} onChange={this.handleNewCarpoolChange}/></label>
                        <label><span>Return Time: </span><input disabled={!newCarpoolEnabled} name="returningTime" value={this.state.newCarpool.returningTime} onChange={this.handleNewCarpoolChange}/></label>
                        <label><span>Seats: </span><input disabled={!newCarpoolEnabled} type="number" name="seats" value={this.state.newCarpool.seats} onChange={this.handleNewCarpoolChange}/>  (Include Driver)</label>
                        <label><span>Note: </span><br/><textarea disabled={!newCarpoolEnabled} name="note" value={this.state.newCarpool.note} onChange={this.handleNewCarpoolChange}/></label>
                    </div>
                </div>
                <button onClick={this.addButtonClicked}>
                    Add
                </button>
            </>
        );
    }
}
export default AddForm;
