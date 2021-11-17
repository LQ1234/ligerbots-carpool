import React, {Component} from "react";
import EventListEvent from "./eventListEvent";
import EventPopup from "./eventPopup";

class EventList extends Component {
    constructor(props) {
        super(props);
    }
    newEventPressed=()=>{
        this.props.showPopup({
            view: EventPopup,
            newMode: true
        });
    }
    render() {
        return(
            <>
                <div id="events">
                    {
                        Object.values(this.props.events).sort((a,b)=>a.date.getTime()-b.date.getTime()).map((eventObj) =>
                            <EventListEvent
                                popupMessageFunctions={this.props.popupMessageFunctions}
                                showPopup={this.props.showPopup}
                                changeView={this.props.changeView}
                                participants={this.props.allParticipants[eventObj.id]}
                                carpools={this.props.allCarpools[eventObj.id]}
                                adminMode={this.props.adminMode}
                                {...eventObj} key={eventObj.id}/>
                        )
                    }
                </div>
                <br/>
                {this.props.adminMode ? <button type="button" name="button" onClick={this.newEventPressed}>New Event</button>: null}
                <br/>
            </>
        );
    }
}
export default EventList;
