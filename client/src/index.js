
function getTextOrReject(response){
    if(!response.ok) {
        return Promise.reject("Could not contact server");
    }
    return response.text();
}
function deepClone(obj){//quick hack
    return(unflatten(flatten(obj)));
}
function objectFilter(obj,fn){
    let res={};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            if(fn(prop,obj[prop])){
                res[prop]=obj[prop];
            }
        }
    }
    return(res);
}
class CPEventList extends React.Component {
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
                <div className="title">Events</div>
                <div id="events">
                    {
                        Object.values(this.props.events).map((eventObj) =>
                            <CPEvent popupMessageFunctions={this.props.popupMessageFunctions} showPopup={this.props.showPopup} changeView={this.props.changeView} {...eventObj} key={eventObj.id}/>
                        )
                    }
                </div>
                <br/>
                <button type="button" name="button" onClick={this.newEventPressed}>New Event</button><br/>

            </>
        );
    }
}
class CPEvent extends React.Component {
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
                            sameDay: '[Today]',
                            nextDay: '[Tomorrow]',
                            nextWeek: 'dddd',
                            lastDay: '[Yesterday]',
                            lastWeek: '[Last] dddd',
                            sameElse: 'DD/MM/YYYY'
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

class CPAddForm extends React.Component {
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
                    Departing Trip: <CPCarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={true} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.selectedCarpools} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/>
                    &emsp;
                    Returning Trip: <CPCarpoolDropdown includeNewCarpool={true} participants={this.props.participants} isDepartingTrip={false} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.selectedCarpools} selectedCarpoolsChangeHandler={this.handleSelectedCarpoolsChange}/>
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
class CPCarpoolDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            isOpen: false
        };
        this.selectorDropdown=React.createRef();

        this.resizeListener=()=>{
            if(this.selectorDropdown.current==null)return;
            dropdownBounding(this.selectorDropdown.current);
        }
    }
    componentDidMount() {
        window.addEventListener("resize", this.resizeListener)
        this.resizeListener();
    }
    componentDidUpdate() {
        this.resizeListener();

    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeListener)
    }
    handleClick = (event)=>{
        this.setState({isOpen: true});
    }
    handleHide = (event)=>{
        this.setState({isOpen: false});
    }

    render(){
        let selectedCarpool=this.props.selectedCarpools[this.props.isDepartingTrip?"departing":"returning"];
        let selectedCarpoolName="";
        //0 for waitlist, 1 for parent, 2 for new carpool, 3 for existing carpool.
        switch(selectedCarpool.type){
            case 0:
                selectedCarpoolName="Waitlist";
                break;
            case 1:
                selectedCarpoolName="Parent";
                break;
            case 2:
                selectedCarpoolName="New Carpool";
                break;
            default:
                let carpool=Object.values(this.props.availableCarpools).find((c)=>c.id==selectedCarpool.carpoolId);
                selectedCarpoolName=carpool?carpool.name:"<Invalid carpool>"
                break;
        }
        return(
            <div className="carpoolSelector">
                <button className="selectorButton" onClick={this.handleClick}>
                    {selectedCarpoolName}
                </button>
                {
                    this.state.isOpen?
                    <>
                        <div className="clickDetect" onClick={this.handleHide}></div>
                        <div className="selectorDropdown"  ref={this.selectorDropdown}>
                            <div className="label selectorRow">
                                <div className="carpoolName">Name</div>
                                <div className="carpoolOrigin">Origin</div>
                                <div className="carpoolTime">Time</div>
                            </div>
                            <a className={(selectedCarpool.type==1)?"selectorRow selected":"selectorRow"} onClick={()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:1,carpoolId:-1});this.handleHide()}}>
                                <div className="carpoolName">Parent</div>
                            </a>
                            {
                                Object.values(this.props.availableCarpools).map((carpoolObj) =>{
                                    let seatsTaken=this.props.isDepartingTrip?carpoolObj.takenDeparting:carpoolObj.takenReturning;
                                    let classes=["selectorRow"];

                                    let driver=this.props.participants[carpoolObj.driverId];
                                    if(!driver){
                                        return(<div className="selectorRow" key={carpoolObj.id}>?[err no driver]</div>)
                                    }
                                    let realSeats=(this.props.isDepartingTrip?(driver.carpool.departing.type==3&&driver.carpool.departing.carpoolId==carpoolObj.id):(driver.carpool.returning.type==3&&driver.carpool.returning.carpoolId==carpoolObj.id))?carpoolObj.seats:0;
                                    let disabled=seatsTaken>=realSeats;
                                    if(carpoolObj.id==selectedCarpool.carpoolId&&selectedCarpool.type==3)classes.push("selected");
                                    if(disabled)classes.push("disabled");
                                    return(
                                        <a className={classes.join(' ')} key={carpoolObj.id} onClick={disabled?null:()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:3,carpoolId:carpoolObj.id});this.handleHide()}}>
                                            <div className="carpoolName">{carpoolObj.name}<span className="carpoolCount">{seatsTaken}/{realSeats}</span></div>
                                            <div className="carpoolOrigin">{carpoolObj.origin}</div>
                                            <div className="carpoolTime">{this.props.isDepartingTrip?carpoolObj.departingTime:carpoolObj.returningTime}</div>
                                        </a>
                                    );
                                })
                            }
                            <a className={(selectedCarpool.type==0)?"selectorRow selected":"selectorRow"} onClick={()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:0,carpoolId:-1});this.handleHide()}}>
                                <div className="carpoolName">Waitlist</div>
                            </a>

                            {this.props.includeNewCarpool?<a className={(selectedCarpool.type==2)?"selectorRow selected":"selectorRow"} onClick={()=>{this.props.selectedCarpoolsChangeHandler(this.props.isDepartingTrip,{type:2,carpoolId:-1});this.handleHide()}}>
                                <div className="carpoolName">New Carpool</div>
                            </a>:null}
                        </div>
                    </>:null
                }
            </div>
        );
    }
}
function dropdownBounding(dropdown){
    let rect=dropdown.parentElement.querySelector(".selectorButton").getBoundingClientRect();
    let dwidth=500;
    let windowwidth=document.documentElement.clientWidth;

    let margin=20;
    if(rect.x+dwidth+margin<windowwidth){
        dropdown.style.width=`${dwidth}px`;
        dropdown.style.right=`auto`;
        dropdown.style.left=`auto`;
    }else if(dwidth+2*margin<windowwidth){
        dropdown.style.width=`${dwidth}px`;
        dropdown.style.right=`${margin}px`;
        dropdown.style.left=`auto`;
    }else{
        dropdown.style.width=`auto`;
        dropdown.style.right=`${margin}px`;
        dropdown.style.left=`${margin}px`;
    }
}
class CPDriverView extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            dropTargetsShown:false,
            dropTargetDeparting:false,
            dropTargetCarpool:null,
            dropTargetParticipantId:null
        }
        this.dropHandlers={startDrag:this.startDrag,dragSet:this.dragSet,endDrag:this.endDrag};
    }
    showDropOutline=()=>{
        if(this.state.dropOutlineShown==false)
            this.setState({dropOutlineShown:true})
    }
    eventPressed=()=>{
        this.props.showPopup({
            view: EventPopup,
            newMode: false,
            id:this.props.eventId
        });
    }
    startDrag=(dropTargetDeparting,dropTargetParticipantId)=>{
        this.setState({dropTargetsShown:true,dropTargetDeparting:dropTargetDeparting,dropTargetParticipantId:dropTargetParticipantId});
    }
    dragSet=(carpoolIdentifier)=>{
        this.setState({
            dropTargetCarpool:carpoolIdentifier
        })
    }
    endDrag=()=>{
        let participantId=this.state.dropTargetParticipantId;
        if((participantId in this.props.participants)&&this.state.dropTargetCarpool){
            let participant=this.props.participants[participantId];
            let req=flatten({...participant})
            if(this.state.dropTargetDeparting){
                req.carpool_departing_type=parseInt(this.state.dropTargetCarpool.type);
                req.carpool_departing_carpoolId=parseInt(this.state.dropTargetCarpool.carpoolId);
            }else{
                req.carpool_returning_type=parseInt(this.state.dropTargetCarpool.type);
                req.carpool_returning_carpoolId=parseInt(this.state.dropTargetCarpool.carpoolId);
            }
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
            })
            .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
        }
        this.setState({dropTargetsShown:false,dropTargetDeparting:false});
    }
    render(){
        let idByDepartingCarpool={};
        let idsInDepartingWaitlist=[];
        let idsWithDepartingParent=[];
        let idByReturningCarpool={};
        let idsInReturningWaitlist=[];
        let idsWithReturningParent=[];
        //0 for waitlist, 1 for parent, 2 for new carpool, 3 for existing carpool.

        for (let id of Object.keys(this.props.participants)) {
            let person=this.props.participants[id];
            switch(person.carpool.departing.type){
                case 0:
                idsInDepartingWaitlist.push(id);
                break;
                case 1:
                idsWithDepartingParent.push(id);
                break;
                default:
                let carpoolId=person.carpool.departing.carpoolId;
                if(!(carpoolId in idByDepartingCarpool))
                    idByDepartingCarpool[carpoolId]=[];
                idByDepartingCarpool[carpoolId].push(id);
            }
        }
        for (let id of Object.keys(this.props.participants)) {
            let person=this.props.participants[id];
            switch(person.carpool.returning.type){
                case 0:
                idsInReturningWaitlist.push(id);
                break;
                case 1:
                idsWithReturningParent.push(id);
                break;
                default:
                let carpoolId=person.carpool.returning.carpoolId;
                if(!(carpoolId in idByReturningCarpool))
                    idByReturningCarpool[carpoolId]=[];
                idByReturningCarpool[carpoolId].push(id);
            }
        }
        let row=0;
        let dropInformation={
            dropTargetsShown:this.state.dropTargetsShown,
            dropTargetDeparting:this.state.dropTargetDeparting,
            dropTargetCarpool:this.state.dropTargetCarpool
        }
        return(
            <>
                <div className="subtitle">
                    <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Driver View for <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
                </div>
                Hold & drag to change carpools, click to inspect.
                <br/>
                <br/>
                <div className={"driverViewGrid"+(this.props.dropOutlineShown?" dropOutline":"")}>
                    <div className="tripKey">
                        Departing
                    </div>
                    <div className="tripKey">
                        Returning
                    </div>

                    {
                        Object.keys(this.props.carpools).map((a)=>{
                            return(
                                <CPDriverViewCarpool dropHandlers={this.dropHandlers} {...dropInformation} row={row+=2} showPopup={this.props.showPopup} showDropOutline={this.showDropOutline} key={a} for={{type: 3,carpoolId: a}} containingDeparting={idByDepartingCarpool[a]||[]} containingReturning={idByReturningCarpool[a]||[]} participants={this.props.participants} carpools={this.props.carpools} />
                            );
                        })
                    }
                    <CPDriverViewCarpool dropHandlers={this.dropHandlers} {...dropInformation} row={row+=2} showPopup={this.props.showPopup} showDropOutline={this.showDropOutline} for={{type: 0,carpoolId: -1}} containingDeparting={idsInDepartingWaitlist} containingReturning={idsInReturningWaitlist} participants={this.props.participants} carpools={this.props.carpools} />
                    <CPDriverViewCarpool dropHandlers={this.dropHandlers} {...dropInformation} row={row+=2} showPopup={this.props.showPopup} showDropOutline={this.showDropOutline} for={{type: 1,carpoolId: -1}} containingDeparting={idsWithDepartingParent} containingReturning={idsWithReturningParent} participants={this.props.participants} carpools={this.props.carpools} />
                </div>
            </>
        );
    }
}

class CPDriverViewCarpool extends React.Component {
    constructor(props) {
        super(props);
    }
    carpoolPressed=()=>{
        if(this.props.for.type==3){
            this.props.showPopup({
                view: CarpoolPopup,
                id:this.props.for.carpoolId
            });
        }

    }
    render(){
        let props=this.props;
        let name;
        let countInfo="";

        switch(props.for.type){
            case 0:
            name="Waitlist";
            break;
            case 1:
            name="Parent";
            break;
            default:{
                let carpool=props.carpools[props.for.carpoolId]
                let driver=this.props.participants[carpool.driverId];
                if(!driver){
                    countInfo="Driverless"
                    break;
                }
                if(driver.carpool.departing.type==3&&driver.carpool.departing.carpoolId==carpool.id){
                    countInfo+=`${carpool.takenDeparting}/${carpool.seats}`
                }else{
                    countInfo+="No Departing Trip"
                }
                countInfo+=", "
                if(driver.carpool.returning.type==3&&driver.carpool.returning.carpoolId==carpool.id){
                    countInfo+=`${carpool.takenReturning}/${carpool.seats}`
                }else{
                    countInfo+="No Returning Trip"
                }
                name=carpool.name;
            }
        }
        let driverId=props.for.type==3?props.carpools[props.for.carpoolId].driverId:-1;
        if(driverId>=0&&!(driverId in props.participants))driverId=-1;

        let isDropHovered=this.props.dropTargetCarpool&&(this.props.dropTargetCarpool.type==this.props.for.type&&(this.props.for.type!=3||this.props.dropTargetCarpool.carpoolId==this.props.for.carpoolId))
        return(
            <>
                {
                    this.props.dropTargetsShown?(
                        this.props.dropTargetDeparting?
                        <div className={"dropTarget"+(isDropHovered?" hover":"")} style={{"gridRow":`${this.props.row} / span 2`,"gridColumn":1}} data-type={this.props.for.type} data-carpool-id={this.props.for.carpoolId}></div>:
                        <div className={"dropTarget"+(isDropHovered?" hover":"")} style={{"gridRow":`${this.props.row} / span 2`,"gridColumn":2}} data-type={this.props.for.type} data-carpool-id={this.props.for.carpoolId}></div>
                    ):null
                }
                <div style={{"gridRow":this.props.row}} className={"carpoolHeader"+((this.props.for.type==3)?" underlineable":"")} onClick={this.carpoolPressed}>
                    {name}
                    <span className="countInfo">
                        {countInfo}
                    </span>
                </div>
                <div style={{"gridRow":this.props.row+1,"gridColumn":1}} className="carpoolTripContainer">
                    {//driver first
                        driverId>=0&&(props.participants[driverId].carpool.departing.type==3&&props.participants[driverId].carpool.departing.carpoolId==props.for.carpoolId)?
                        <CPDriverViewCarpoolParticipant isDepartingTrip={true} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={driverId} isDriver={true} participant={props.participants[driverId]}/>
                        :null
                    }
                    {
                        props.containingDeparting.map((id)=>{
                            if(driverId==id)return(null);
                            return(
                                <CPDriverViewCarpoolParticipant isDepartingTrip={true} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={id} isDriver={false} participant={props.participants[id]}/>
                            );
                        })
                    }
                </div>
                <div style={{"gridRow":this.props.row+1,"gridColumn":2}} className="carpoolTripContainer">
                    {//driver first
                        driverId>=0&&(props.participants[driverId].carpool.returning.type==3&&props.participants[driverId].carpool.returning.carpoolId==props.for.carpoolId)?
                        <CPDriverViewCarpoolParticipant isDepartingTrip={false} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={driverId} isDriver={true} participant={props.participants[driverId]}/>
                        :null
                    }
                    {
                        props.containingReturning.map((id)=>{
                            if(driverId==id)return(null);
                            return(
                                <CPDriverViewCarpoolParticipant isDepartingTrip={false} dropHandlers={this.props.dropHandlers} showPopup={this.props.showPopup} showDropOutline={this.props.showDropOutline} key={id} isDriver={false} participant={props.participants[id]}/>
                            );
                        })
                    }

                </div>

            </>
        );
    }
}
class CPDriverViewCarpoolParticipant extends React.Component {/*Reimplement drag and drop to support mobile*/
    holdTime=300;//ms for press to register as drag
    constructor(props) {
        super(props);
        this.state={
            dragpos:{
                x:0,
                y:0
            }
        }
        this.startDragPos={

        };
        this.div=React.createRef();
        this.holdStart=0;
    }
    removeMouseListeners(){
        window.removeEventListener("mouseup", this.mouseUpListener)
        window.removeEventListener("mousemove", this.mouseMoveListener)
    }
    addMouseListeners(){
        window.addEventListener("mouseup", this.mouseUpListener)
        window.addEventListener("mousemove", this.mouseMoveListener)
    }

    mouseDownListener=(e)=>{
        this.removeMouseListeners();
        this.startDragPos.x=e.pageX;
        this.startDragPos.y=e.pageY;
        this.addMouseListeners();
    }
    mouseMoveListener=(e)=>{
        this.dropStartHandler();

        this.setState({
            dragpos: {
                x:e.pageX-this.startDragPos.x,
                y:e.pageY-this.startDragPos.y
            }
        });
        this.dropMoveHandler(e.clientX,e.clientY);
    }
    mouseUpListener=(e)=>{
        if(this.state.dragpos.x==0&&this.state.dragpos.y==0){
            this.clickListener();
        }else{
            this.setState({
                dragpos: {
                    x:0,
                    y:0
                }
            });
            this.dropEndHandler();
        }

        this.removeMouseListeners();
    }
    removeTouchListeners(){
        window.removeEventListener("touchend", this.touchEndListener)
        window.removeEventListener("touchmove", this.touchMoveListener)
    }
    addTouchListeners(){
        window.addEventListener("touchend", this.touchEndListener, {passive: true})
        window.addEventListener("touchmove", this.touchMoveListener, {passive: true})
    }
    touchStartListener=(e)=>{
        e.preventDefault();

        this.removeTouchListeners();
        this.startDragPos.x=e.touches[0].pageX;
        this.startDragPos.y=e.touches[0].pageY;
        this.addTouchListeners();
        this.holdStart=performance.now();
        this.holdTimeout=setTimeout(()=>{
            this.setState({
                dragpos: {
                    x:0,
                    y:.00001
                }
            });
            this.dropStartHandler();
         },this.holdTime);
    }
    touchMoveListener=(e)=>{
        if(performance.now()-this.holdStart>this.holdTime){
            e.preventDefault();

            clearTimeout(this.holdTimeout)

            this.setState({
                dragpos: {
                    x:e.touches[0].pageX-this.startDragPos.x,
                    y:e.touches[0].pageY-this.startDragPos.y
                }
            });
            this.dropMoveHandler(e.touches[0].clientX,e.touches[0].clientY);
        }else{
            if(Math.abs(e.touches[0].pageX-this.startDragPos.x>5)||Math.abs(e.touches[0].pageY-this.startDragPos.y)>5){
                clearTimeout(this.holdTimeout)
                this.removeTouchListeners();
                this.setState({
                    dragpos: {
                        x:0,
                        y:0
                    }
                });
            }
        }
    }
    touchEndListener=(e)=>{
        clearTimeout(this.holdTimeout)
        if(performance.now()-this.holdStart<this.holdTime){
            this.clickListener();
        }else{
            this.dropEndHandler();
        }
        e.preventDefault();

        this.setState({
            dragpos: {
                x:0,
                y:0
            }
        });
        this.removeTouchListeners();

    }

    dropStartHandler=()=>{
        this.props.dropHandlers.startDrag(this.props.isDepartingTrip,this.props.participant.id);
    }
    dropMoveHandler=(x,y)=>{
        let targets=document.elementsFromPoint(x, y).filter(x=>x.classList.contains("dropTarget"));

        if(targets.length==0){
            this.props.dropHandlers.dragSet(null);
        }else if(targets.length==1){
            this.props.dropHandlers.dragSet(targets[0].dataset)
        }

    }
    dropEndHandler=()=>{
        this.props.dropHandlers.endDrag();
    }
    componentDidMount() {
        //manually add listener due to bug: https://github.com/facebook/react/issues/9809
        this.div.current.addEventListener("touchstart", this.touchStartListener, {passive: false})
        this.showDropOutline();

    }
    componentDidUpdate() {
        this.showDropOutline();
    }
    componentWillUnmount() {
        this.div.current.removeEventListener("touchstart", this.touchStartListener)
    }

    clickListener = ()=>{
        this.props.showPopup({
            view: ParticipantPopup,
            newMode: false,
            id:this.props.participant.id
        });
    }
    dropHandler=()=>{

    }
    showDropOutline=()=>{
        if(!(this.state.dragpos.x==0&&this.state.dragpos.y==0)){
            this.props.showDropOutline()
        }
    }
    render(){
        return(
            <div
                ref={this.div}
                className={"carpoolParticipant draggable"+(this.props.isDriver?" driver":"")+(this.state.dragpos.x==0&&this.state.dragpos.y==0?"":" dragging")}
                onMouseDown={this.mouseDownListener}
                style={{"top":`${this.state.dragpos.y}px`,"left":`${this.state.dragpos.x}px`}}
            >
                {this.props.participant.personalInformation.name}
            </div>
        );
    }
}


class CPParticipantView extends React.Component {
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

    render(){
        console.log(Object.values(this.props.participants).map(participant=>{
            console.log((participant.carpool.departing));
        }));
        return(
            <>
                <div className="subtitle">
                    <button className="backbutton" onClick={this.props.goToEvents}>&larr;</button> Participant View for <span className="imbeddedEvent" onClick={this.eventPressed}>{this.props.events[this.props.eventId].title}</span>
                </div>
                Click to inspect.
                <br/>
                <br/>
                <div className="participantViewGrid">
                    <div className="key">Participant</div>
                    <div className="key">Departing Carpool</div>
                    <div className="key">Returning Carpool</div>
                    {Object.values(this.props.participants).map(
                        participant=>
                        (<CPParticipantViewParticipant {...participant} showPopup={this.props.showPopup} carpools={this.props.carpools} key={participant.id}></CPParticipantViewParticipant>))}
                </div>
            </>
        );
    }
}
class CPParticipantViewParticipant extends React.Component {
    constructor(props) {
        super(props);
        this.state={
        }
    }
    participantPressed=()=>{
        this.props.showPopup({
            view: ParticipantPopup,
            id:this.props.id
        });
    }
    departingCarpoolPressed=()=>{
        if(this.props.carpool.departing.type==3){
            this.props.showPopup({
                view: CarpoolPopup,
                id:this.props.carpool.departing.carpoolId
            });
        }
    }
    returningCarpoolPressed=()=>{
        if(this.props.carpool.returning.type==3){
            this.props.showPopup({
                view: CarpoolPopup,
                id:this.props.carpool.returning.carpoolId
            });
        }
    }
    nameOfCarpool=(carpool)=>{
        let type=carpool.type;//Doesn't work if i refrence directly for some reason
        let carpoolId=carpool.carpoolId;
        switch(type){
            case 0:
                return("Waitlist");
            case 1:
                return("Parent");
            case 2:
                return("New Carpool");
                break;
            default:
                let carpool=Object.values(this.props.carpools).find((c)=>c.id==carpoolId);
                return(carpool?carpool.name:"<Invalid carpool>")
        }
    }

    render(){
        return(<React.Fragment key={this.props.id}>
            <div onClick={this.participantPressed}>{this.props.personalInformation.name}</div>
            <div onClick={this.departingCarpoolPressed}>{this.nameOfCarpool(this.props.carpool.departing)}</div>
            <div onClick={this.returningCarpoolPressed}>{this.nameOfCarpool(this.props.carpool.returning)}</div>
        </React.Fragment>)
    }
}
//https://stackoverflow.com/a/20087506/5771000
function shouldOpenInNewTab(e){
    return(e.ctrlKey||e.shiftKey||e.metaKey||(e.button&&e.button==1));
}

function unflatten(flat_obj){
    let unflattened={};
    Object.keys(flat_obj).forEach((item, i) => {
        let keys=item.split("_");
        let layer=unflattened;
        for (var i = 0; i < keys.length-1; i++) {
            if(!(keys[i] in layer)){
                layer[keys[i]]={};
            }
            layer=layer[keys[i]];
        }
        layer[keys[keys.length-1]]=flat_obj[item];
    });

    return(unflattened);
}
function flatten(obj){
    let flattened={};
    Object.keys(obj).forEach((key, i) => {
        if(typeof obj[key]=="object"){
            let flat_nest=flatten(obj[key]);
            Object.keys(flat_nest).forEach((nested_key, i) => {
                flattened[key+"_"+nested_key]=flat_nest[nested_key]
            });
        }else{
            flattened[key]=obj[key];
        }
    });
    return(flattened);
}
class ParticipantPopup extends React.Component {
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
    render(){
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
                        <div style={{"marginBottom":".5em"}}>
                            Departing Trip: <CPCarpoolDropdown includeNewCarpool={false} participants={this.props.participants} isDepartingTrip={true} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.modified.carpool} selectedCarpoolsChangeHandler={this.handleCarpoolsChange}/>
                            &emsp;
                            Returning Trip: <CPCarpoolDropdown includeNewCarpool={false} participants={this.props.participants} isDepartingTrip={false} availableCarpools={this.props.availableCarpools} selectedCarpools={this.state.modified.carpool} selectedCarpoolsChangeHandler={this.handleCarpoolsChange}/>
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
class CarpoolPopup extends React.Component {
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
class EventPopup extends React.Component {
    constructor(props){
        super(props);
        if(props.newMode){
            this.state={
                modified:{
                    title:"New Event",
                    note:"",
                    defaultDepartingTime: "",
                    defaultReturningTime: "",
                    date: "",
                }
            }
        }else{
            this.state={
                modified:deepClone(props.events[props.id])
            }
        }

        console.log(this.state);
    }
    handleChange=(event) => {
        let target=event.target;
        this.setState({
            modified:{
                ...this.state.modified,
                [target.name]: target.value
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
        fetch('api/edit-event', {
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
    addClicked=()=>{
        let req=flatten({...this.state.modified})
        console.log(req);
        fetch('api/add-event', {
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
        this.cancelClicked();
    }
    deleteClicked=()=>{
        let req=flatten({id:this.props.id})

        fetch('api/delete-event', {
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
        this.cancelClicked();
    }
    render(){
        return(
            <>
                <div className="popup-wrapper" onClick={this.handleHide}>
                    <div className="popup" >
                        <div className="infoGrid">
                            <input name="title" value={this.state.modified.title} className="title" onChange={this.handleChange}/>
                            <label><span>Default Departing Time</span> <input name="defaultDepartingTime" value={this.state.modified.defaultDepartingTime} onChange={this.handleChange}/></label>
                            <label><span>Default Returning Time</span> <input name="defaultReturningTime" value={this.state.modified.defaultReturningTime} onChange={this.handleChange}/></label>
                            <label><span>Date</span> <input name="date" value={this.state.modified.date} onChange={this.handleChange}/></label>
                            <textarea className="note" name="note" value={this.state.modified.note} onChange={this.handleChange}/>
                        </div>
                        {this.props.newMode?<button type="button" name="button" onClick={this.addClicked}>Add</button>:<button type="button" name="button" onClick={this.saveClicked}>Save</button>}
                        &emsp;
                        <button type="button" name="button" onClick={this.cancelClicked}>Cancel</button>
                        &emsp;
                        {this.props.newMode?null:<button type="button" name="button" onClick={this.deleteClicked}>Delete</button>}
                    </div>
                </div>
            </>
        )
    }
}
class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            shownPopup:{
                view: null,
                id: -1
            },
            receivedResponse:false,
            participants:{},
            carpools:{},
            events:{},
            shownPopupMessage:null,
        }
        this.searchParams=new URLSearchParams(window.location.search);
        if(["add-form","driver-view","participant-view"].includes(this.searchParams.get("view"))){
            let eventId=parseInt(this.searchParams.get("eventId"));
            if(isNaN(eventId)){
                this.state.view="event-list";
            }else{
                this.state.view=this.searchParams.get("view");
                this.state.eventId=eventId;
            }
        }else{
            this.state.view="event-list";
        }

        Promise.all([
            fetch('api/events', {
                method: 'GET',
            }),
            fetch('api/carpools', {
                method: 'GET',
            }),
            fetch('api/participants', {
                method: 'GET',
            })
        ]).then((res)=>{
            return(Promise.all(res.map(x=>x.json())));
        }).then((res)=>{
            this.setState((state)=>{
                return{
                    ...state,
                    receivedResponse:true,
                    events:{...state.events,...res[0].events.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})},
                    carpools:{...state.carpools,...res[1].carpools.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})},
                    participants:{...state.participants,...res[2].participants.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})}
                }
            })
        });
        var evtSource = new EventSource('api/update-stream');
        evtSource.addEventListener("put-event", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                return({
                    ...state,
                    events:{
                        ...state.events,
                        [parsed.id]:parsed
                    }
                })
            });
        })
        evtSource.addEventListener("delete-event", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            this.setState((state)=>{
                let eventsClone=Object.assign({}, state.events);
                delete eventsClone[parsed.id]
                return({
                    ...state,
                    participants:objectFilter(state.participants,(id,obj)=>obj.eventId!=parsed.id),
                    carpools:objectFilter(state.carpools,(id,obj)=>obj.eventId!=parsed.id),
                    events:eventsClone
                })
            });
        });
        evtSource.addEventListener("put-participant", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            console.log("parsed",parsed);
            this.setState((state)=>{
                return({
                    ...state,
                    participants:{
                        ...state.participants,
                        [parsed.id]:parsed
                    }
                })
            });
        })
        evtSource.addEventListener("delete-participant", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            console.log("parsed",parsed);
            this.setState((state)=>{
                let participantsClone=Object.assign({}, state.participants);
                delete participantsClone[parsed.id]
                return({
                    ...state,
                    participants:participantsClone
                })
            });
        });
        evtSource.addEventListener("put-carpool", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            console.log("parsed",parsed);
            this.setState((state)=>{
                return({
                    ...state,
                    carpools:{
                        ...state.carpools,
                        [parsed.id]:parsed
                    }
                })
            });
        })
        evtSource.addEventListener("delete-carpool", (e) => {
            let parsed=unflatten(JSON.parse(e.data));
            console.log("parsed",parsed);
            this.setState((state)=>{
                let carpoolsClone=Object.assign({}, state.carpools);
                delete carpoolsClone[parsed.id]
                return({
                    ...state,
                    carpools:carpoolsClone
                })
            });
        });
        evtSource.addEventListener("refresh-participants", (e) => {
            fetch('api/participants', {
                method: 'GET',
            })
            .then((res)=>{
                return(res.json());
            }).then((res)=>{
                this.setState((state)=>{
                    return{
                        ...state,
                        receivedResponse:true,
                        participants:{...res.participants.reduce((b,a)=>({...b,[a.id]:unflatten(a)}),{})}
                    }
                })
            });
        });
        this.popupMessageFunctions={
            showPopupMessage:this.showPopupMessage,
            generateServerResponsePopupMessage:this.generateServerResponsePopupMessage,
            generateServerErrorPopupMessage:this.generateServerErrorPopupMessage
        };
    }

    popStateListener=(e)=>{
        if(e.state==null){
            this.setState({view:"event-list"});
        }else{
            this.setState({view:e.state.view,eventId:e.state.eventId});
        }
    }
    changeView=(view,eventId,newTab)=>{
        if(newTab){
            this.searchParams.set("view",view);
            this.searchParams.set("eventId",eventId);
            window.open("?"+this.searchParams.toString());

        }else{
            this.setState({view:view,eventId:eventId});
            this.searchParams.set("view",view);
            this.searchParams.set("eventId",eventId);
            let stateObject={"view":view,"eventId":eventId};
            history.pushState(stateObject,"","?"+this.searchParams.toString());
        }
    }
    goToEvents=(e)=>{

        this.changeView("event-list",-1,e?shouldOpenInNewTab(e):false);
    }
    showPopup=(newPopup)=>{
        this.setState({
            shownPopup:newPopup
        });
    }
    hidePopup=(e)=>{
        this.setState({
            shownPopup:{
                view:null,
                id:-1,
                newMode:false
            }
        })
    }

    //unrelated popup message methods
    showPopupMessage=(newPopup)=>{
        this.setState({
            shownPopupMessage:newPopup
        });
    }
    hidePopupMessage=()=>{
        this.setState({
            shownPopupMessage:null
        });
    }
    generateServerResponsePopupMessage=(res)=>{
        try {
            let parsed=JSON.parse(res);
            if(parsed.result=="failure"){
                this.showPopupMessage({message:parsed.error,type:PopupMessage.error});
            }else if(parsed.result=="success"){

            }else{
                this.showPopupMessage({message:"Invalid server response",type:PopupMessage.error});
            }
        } catch (e) {
            this.showPopupMessage({message:"Invalid server response",type:PopupMessage.error});

        }
    }
    generateServerErrorPopupMessage=(err)=>{
        this.showPopupMessage({message:""+err,type:PopupMessage.error});
    }
    componentDidMount() {
        window.addEventListener("popstate", this.popStateListener)
    }
    componentWillUnmount() {
        window.removeEventListener("popstate", this.popStateListener)
    }

    render(){
        let carpoolByEventWithCount={};
        let participantByEvent={};

        for(let eventId of Object.keys(this.state.events)){
            carpoolByEventWithCount[eventId]={}
            participantByEvent[eventId]={}
        }
        for (let carpoolId of Object.keys(this.state.carpools)) {
            let carpool=this.state.carpools[carpoolId];
            carpoolByEventWithCount[carpool.eventId][carpoolId]=Object.assign({takenDeparting:0,takenReturning:0},carpool);//immutability
        }
        for (let participantId of Object.keys(this.state.participants)) {
            let participant=this.state.participants[participantId];
            participantByEvent[participant.eventId][participantId]=participant;

            if(participant.carpool.departing.type==3){
                let carpoolId=participant.carpool.departing.carpoolId;
                if(carpoolId in carpoolByEventWithCount[participant.eventId]){
                    carpoolByEventWithCount[participant.eventId][carpoolId].takenDeparting++;
                }else{
                    console.log("warning: participant in invalid carpool", participant);
                }
            }
            if(participant.carpool.returning.type==3){
                let carpoolId=participant.carpool.returning.carpoolId;
                if(carpoolId in carpoolByEventWithCount[participant.eventId]){
                    carpoolByEventWithCount[participant.eventId][carpoolId].takenReturning++;
                }else{
                    console.log("warning: participant in invalid carpool", participant);
                }
            }

        }


        let eventsWithStats=Object.assign({},this.state.events);

        for(let eventId of Object.keys(this.state.events)){
            let stats={
                amountCarpools:0,
                totalCapacity:0,
                takenDeparting:0,
                takenReturning:0,
                departingWaitlist:0,
                returningWaitlist:0,
            };

            for (let carpoolId of Object.keys(carpoolByEventWithCount[eventId])) {
                let carpool=carpoolByEventWithCount[eventId][carpoolId];
                stats.amountCarpools++;
                stats.totalCapacity+=parseInt(carpool.seats);
            }

            for (let participantId of Object.keys(participantByEvent[eventId])) {
                let participant=participantByEvent[eventId][participantId];
                switch(participant.carpool.departing.type){
                    case 0:
                    stats.departingWaitlist++;
                    break;
                    case 1:
                    break;
                    default:
                    stats.takenDeparting++;
                }
                switch(participant.carpool.returning.type){
                    case 0:
                    stats.returningWaitlist++;
                    break;
                    case 1:
                    break;
                    default:
                    stats.takenReturning++;
                }
            }
            eventsWithStats[eventId]=Object.assign({stats:stats},eventsWithStats[eventId]);//immutability
        }


        let elem=null;
        let popup=null;
        let invalidEventIdError=<>
            <div>Invalid Event</div>
            <button type="button" name="button" onClick={this.goToEvents}>Go back</button>
        </>;

        if(this.state.receivedResponse){
            switch (this.state.view) {
                case "event-list":{
                    elem=<CPEventList popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={eventsWithStats}/>;
                    break;
                }
                case "add-form":{
                    let eventId=this.state.eventId;
                    if(!(eventId in this.state.events))elem=invalidEventIdError;
                    else elem=<CPAddForm popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={this.state.events} eventId={eventId} participants={participantByEvent[eventId]} availableCarpools={carpoolByEventWithCount[eventId]}/>;
                    break;
                }
                case "driver-view":{
                    let eventId=this.state.eventId;
                    if(!(eventId in this.state.events))elem=invalidEventIdError;
                    else elem=<CPDriverView popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={this.state.events} eventId={eventId} carpools={carpoolByEventWithCount[eventId]} participants={participantByEvent[eventId]}/>;
                    break;
                }
                case "participant-view":{
                    let eventId=this.state.eventId;
                    if(!(eventId in this.state.events))elem=invalidEventIdError;
                    else elem=<CPParticipantView popupMessageFunctions={this.popupMessageFunctions} goToEvents={this.goToEvents} showPopup={this.showPopup} changeView={this.changeView} events={this.state.events} eventId={eventId} carpools={carpoolByEventWithCount[eventId]} participants={participantByEvent[eventId]}/>;
                    break;
                }
            }
            {
                switch(this.state.shownPopup.view){
                    case ParticipantPopup:{
                        if(!(this.state.shownPopup.id in this.state.participants))break;
                        let eventId=this.state.participants[this.state.shownPopup.id].eventId;
                        popup=<ParticipantPopup popupMessageFunctions={this.popupMessageFunctions} hidePopup={this.hidePopup} availableCarpools={carpoolByEventWithCount[eventId]} participants={this.state.participants} id={this.state.shownPopup.id}/>
                        break;
                    }
                    case CarpoolPopup:{
                        if(!(this.state.shownPopup.id in this.state.carpools))break;
                        let eventId=this.state.carpools[this.state.shownPopup.id].eventId;
                        popup=<CarpoolPopup popupMessageFunctions={this.popupMessageFunctions} hidePopup={this.hidePopup} carpools={this.state.carpools} id={this.state.shownPopup.id}/>
                        break;
                    }
                    case EventPopup:{
                        if((!this.state.shownPopup.newMode)&&!(this.state.shownPopup.id in this.state.events))break;
                        popup=<EventPopup popupMessageFunctions={this.popupMessageFunctions} hidePopup={this.hidePopup} newMode={this.state.shownPopup.newMode} events={this.state.events} id={this.state.shownPopup.id}/>
                        break;
                    }
                }
            }
        }else{
            elem=<div>Loading...</div>
        }


        return(
            <>
                {popup}
                {elem}
                {this.state.shownPopupMessage?<PopupMessage hidePopupMessage={this.hidePopupMessage} {...this.state.shownPopupMessage}/>:null}
            </>
        );
    }
}

class PopupMessage extends React.Component {
    static error=0;
    static message=1;
    static warning=2;
    constructor(props){
        super(props);
    }
    render(){
        return(
        <div className={"overlayMessage"+(this.props.type==PopupMessage.error?" error":" message")}>
            <div>
                {this.props.message}
            </div>
            <button className="closeButton" onClick={this.props.hidePopupMessage}>X</button>
        </div>);
    }
}

ReactDOM.render(
    <App view=""/>,
    document.getElementById('root')
);
