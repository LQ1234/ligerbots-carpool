import React, {Component} from "react";
import EventPopup from "./eventPopup";
import ParticipantViewParticipant from "./participantViewParticipant"
class ParticipantView extends Component {
    constructor(props) {
        super(props);
        this.state={
        }
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
        console.log(Object.values(this.props.participants).map(participant=>{
            console.log((participant.carpool.departing));
        }));
        return(
            <div className="popup-wrapper" onClick={this.handleHide}>
                <div className="popup-container">
                    <div className="title" >
                        Grid View
                    </div>
                    {/*
                <div className="subtitle">
                    <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Participant View for <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
                </div>*/}
                    <div className="participantViewGrid">
                        <div className="key">Participant</div>
                        <div className="key">Departing Car</div>
                        <div className="key">Returning Car</div>
                        {Object.values(this.props.participants).map(
                            participant=>
                            (<ParticipantViewParticipant {...participant} showPopup={this.props.showPopup} carpools={this.props.carpools} key={participant.id}></ParticipantViewParticipant>))}
                    </div>
                </div>
            </div>
        );
    }
}
export default ParticipantView;
