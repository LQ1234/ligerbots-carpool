import React, {Component} from "react";
import ParticipantPopup from "./participantPopup";

class DriverViewCarpoolParticipant extends Component {/*Reimplement drag and drop to support mobile*/
    holdTime=300;//ms for press to register as drag
    constructor(props) {
        super(props);
        this.state={
            dragpos:{
                x:0,
                y:0
            },
            dragging: false
        }
        this.startDragPos={

        };
        this.div=React.createRef();
        this.holdStart=0;
    }
    removeMouseListeners(){
        window.removeEventListener("mouseup", this.mouseUpListener)
        window.removeEventListener("mousemove", this.mouseMoveListener)
        window.removeEventListener("contextmenu", this.contextMenuListener)

    }
    addMouseListeners(){
        window.addEventListener("mouseup", this.mouseUpListener)
        window.addEventListener("mousemove", this.mouseMoveListener)
        window.addEventListener("contextmenu", this.contextMenuListener, {passive: false})
    }

    mouseDownListener=(e)=>{

        if(!(e.buttons&1) || this.state.dragging)return;
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
            },
            dragging:true
        });
        this.dropMoveHandler(e.clientX,e.clientY);
    }
    mouseUpListener=(e)=>{
        if(e.buttons&1)return;

        if(!this.state.dragging){
            this.clickListener();
        }else{
            this.setState({
                dragpos: {
                    x:0,
                    y:0
                },
                dragging: false
            });
            this.dropEndHandler();
        }

        this.removeMouseListeners();
    }
    contextMenuListener=(e)=>{
        e.preventDefault();
    }
    removeTouchListeners(){
        window.removeEventListener("touchend", this.touchEndListener)
        window.removeEventListener("touchmove", this.touchMoveListener)
        window.removeEventListener("contextmenu", this.contextMenuListener)
    }
    addTouchListeners(){
        window.addEventListener("touchend", this.touchEndListener, {passive: false})
        window.addEventListener("touchmove", this.touchMoveListener, {passive: false})
        window.addEventListener("contextmenu", this.contextMenuListener, {passive: false})
    }

    touchStartListener=(e)=>{
        this.removeTouchListeners();
        this.startDragPos.x=e.touches[0].pageX;
        this.startDragPos.y=e.touches[0].pageY;
        this.addTouchListeners();
        this.holdStart=performance.now();
        this.holdTimeout=setTimeout(()=>{
            this.setState({
                dragpos: {
                    x:0,
                    y:0
                },
                dragging: true
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
            },
            dragging:false
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
                className={"carpoolParticipant  draggable"+(this.props.isDriver?" driver":"")+(this.state.dragging?" dragging":"")}
                onMouseDown={this.mouseDownListener}
                style={{"top":`${this.state.dragpos.y}px`,"left":`${this.state.dragpos.x}px`}}
            >
                <div className={"carpoolParticipantText"+(this.state.dragging?"":" showeditsymbol")}>{"•\u00A0"+this.props.participant.personalInformation.name}</div>
            </div>
        );
    }
}
export default DriverViewCarpoolParticipant;
