import React, {Component} from "react";
import CarpoolDropdown from "./carpoolDropdown";
import EventPopup from "./eventPopup";
import {flatten,getTextOrReject} from "../util.js";

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
                },
                isDriver: false,
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
        let req=flatten({
            eventId:this.props.eventId,
            personalInformation:this.state.personalInformation,
            carpool:this.state.carpool,
            ...this.state.newCarpool
        });
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
        return(
            <>
                <div className="subtitle">
                    <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Add Participant/Driver to <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
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
                        <div>
                            <label><input type="radio" name="isDriver" checked={!this.state.carpool.isDriver} value="no" onChange={this.handleIsDriverChange}/>Participant</label>
                            &emsp;
                            <label><input type="radio" name="isDriver" checked={this.state.carpool.isDriver} value="yes" onChange={this.handleIsDriverChange}/>Driver</label>
                        </div>
                    </div>
                </div>
                {
                    this.state.carpool.isDriver?<>
                        <div className="sectiontitle">
                            New Carpool
                        </div>
                        <div className="section">
                            <div className="infoGrid">
                                <label><span>Name: </span><input name="name" value={this.state.newCarpool.name} onChange={this.handleNewCarpoolChange}/></label>
                                <label><span>Origin: </span><input name="origin" value={this.state.newCarpool.origin} onChange={this.handleNewCarpoolChange}/></label>
                                <label><span>Departing Time: </span><input name="departingTime" value={this.state.newCarpool.departingTime} onChange={this.handleNewCarpoolChange}/></label>
                                <label><span>Return Time: </span><input name="returningTime" value={this.state.newCarpool.returningTime} onChange={this.handleNewCarpoolChange}/></label>
                                <label><span>Seats: </span><input type="number" name="seats" value={this.state.newCarpool.seats} onChange={this.handleNewCarpoolChange}/>  (Include Driver)</label>
                                <div>
                                    <span>Trip: </span><br/>
                                    <label><input type="radio" name="trip" checked={this.state.newCarpool.trip==0} value="0" onChange={this.handleNewCarpoolChange}/>Departing</label>
                                    &emsp;
                                    <label><input type="radio" name="trip" checked={this.state.newCarpool.trip==1} value="1" onChange={this.handleNewCarpoolChange}/>Returning</label>
                                    &emsp;
                                    <label><input type="radio" name="trip" checked={this.state.newCarpool.trip==2} value="2" onChange={this.handleNewCarpoolChange}/>Both</label>
                                </div>
                                <label><span>Note: </span><br/><textarea name="note" value={this.state.newCarpool.note} onChange={this.handleNewCarpoolChange}/></label>
                            </div>
                        </div>
                    </>:
                    <>
                        <div className="sectiontitle">
                            Carpool
                        </div>
                        <div className="section">
                            Departing Trip: <CarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={true} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.carpool} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/>
                            &emsp;
                            Returning Trip: <CarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={false} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.carpool} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/>
                        </div>
                    </>
                }
                <br/>
                <button onClick={this.addButtonClicked}>
                    Add
                </button>
            </>
        );
    }
}
export default AddForm;
