import React, {Component} from "react";
import {shouldOpenInNewTab} from "../util.js";
import EventPopup from "./eventPopup";
import moment from 'moment';

class EventListEvent extends Component {
    constructor(props){
        super(props);
    }

    editClicked=() => {
        this.props.showPopup({
            view: EventPopup,
            newMode: false,
            id:this.props.id
        });
    }
    addClicked=(e)=>{
        this.props.changeView("add-form",this.props.id,shouldOpenInNewTab(e));
    }
    driverViewClicked=(e)=>{
        this.props.changeView("driver-view",this.props.id,shouldOpenInNewTab(e));
    }
    participantViewClicked=(e)=>{
        this.props.changeView("participant-view",this.props.id,shouldOpenInNewTab(e));
    }



    render(){
        let eventMoment=moment(this.props.date);
        return(
            <div>
                <div className="title">
                    {this.props.title}
                    <span className="date">
                        {eventMoment.calendar({
                            sameDay: "[Today]",
                            nextDay: "[Tomorrow]",
                            nextWeek: "dddd",
                            lastDay: "[Yesterday]",
                            lastWeek: "[Last] dddd",
                            sameElse: "MMMM Do, YYYY"
                        })}
                    </span>
                </div>

                <div className="dbbox">
                    <div className="description">

                        <div className="note">{this.props.note}</div>
                        <div className="statistics">
                            <strong>{this.props.stats.amountCarpools}</strong> carpools have the capacity of <strong>{this.props.stats.totalCapacity}</strong> people.<br/>
                            <strong>{this.props.stats.takenDeparting}</strong> seats taken in departing trip, <strong>{this.props.stats.takenReturning}</strong> seats taken in returning trip.<br/>
                            <strong>{this.props.stats.departingWaitlist}</strong> people are on the departing waitlist and <strong>{this.props.stats.returningWaitlist}</strong> people are on the returning waitlist.<br/>
                            <br/>
                            Default departing time: <strong>{this.props.defaultDepartingTime}</strong>&emsp;
                            Default returning time: <strong>{this.props.defaultReturningTime}</strong><br/>

                        </div>
                    </div>

                    <div className="buttons">
                        <button type="button" name="button" onClick={this.addClicked}>Add Participant/Carpool</button><br/>
                        <button type="button" name="button" onClick={this.driverViewClicked}>Driver View</button><br/>
                        <button type="button" name="button" onClick={this.participantViewClicked}>Participant View</button><br/>
                        <button type="button" name="button" onClick={this.editClicked}>Edit</button><br/>
                    </div>
                </div>
            </div>
        );
    }
}
export default EventListEvent;
