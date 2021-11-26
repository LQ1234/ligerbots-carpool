import React, {Component} from "react";
import {shouldOpenInNewTab} from "../util.js";
import EventPopup from "./eventPopup";
import DriverView from "./driverView";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
    addClickedPassenger=(e)=>{
        this.props.changeView("add-form-passenger",this.props.id,shouldOpenInNewTab(e));
    }
    addClickedCarpool=(e)=>{
        this.props.changeView("add-form-carpool",this.props.id,shouldOpenInNewTab(e));
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
                    {this.props.adminMode?<button type="button" name="button" onClick={this.editClicked}>
                        <img src="https://d18vdu4p71yql0.cloudfront.net/libraries/noun-project/Gear-1ea286ce69.svg"/>
                    </button>:null}
                    <br/>

                </div>

                <div className="dbbox">
                    <div className="description">
                        <div className="scheduleinfo">
                           <span className="cat">Arrival Time:</span> {this.props.defaultDepartingTime.trim() ? this.props.defaultDepartingTime : <i>unspecified</i>}&emsp;&emsp;
                           <span className="cat">Departure Time:</span> {this.props.defaultReturningTime.trim() ? this.props.defaultReturningTime : <i>unspecified</i>}
                         </div>
                         <div className="buttons">
                             <button type="button" name="button" onClick={this.addClickedPassenger}>Add Passenger</button>
                             <button type="button" name="button" onClick={this.addClickedCarpool}>Add Car</button>
                             <button type="button" name="button" onClick={this.participantViewClicked}>View as Grid</button>
                         </div>
                        {this.props.note.trim() ?
                            <div className="note"><div className="noteprefix">Note:</div><ReactMarkdown children={this.props.note} remarkPlugins={[remarkGfm]} /></div>:
                            null}
                        <DriverView
                            popupMessageFunctions={this.props.popupMessageFunctions}
                            showPopup={this.props.showPopup}
                            changeView={this.props.changeView}
                            events={this.props.events}
                            participants={this.props.participants}
                            carpools={this.props.carpools}
                            eventId={this.id}/>
                    </div>


                </div>
            </div>
        );
    }
}
export default EventListEvent;
