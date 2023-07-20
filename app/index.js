'use strict'

const debugContainer = document.getElementById('debug')
const calendarContainer = document.getElementById('calendar')

const calendarPopup = document.createElement('div')
calendarPopup.style.display = 'flex';
calendarPopup.style.flexDirection = 'column';
calendarPopup.style.alignItems = 'center';
calendarPopup.style.justifyContent = 'space-around';
calendarPopup.className =  'input-group mb-3'

//Event title
const eventDiv = document.createElement('div');
eventDiv.style.display = 'flex';
eventDiv.style.flexDirection = 'row';;
const eventLabel = document.createElement('label');
eventLabel.for = 'title-container';
let titleHeader = document.createTextNode('Title');
eventLabel.appendChild(titleHeader);
eventDiv.appendChild(eventLabel);

//Event title
const eventTitle = document.createElement('input');
eventTitle.id = "title-container";
eventTitle.style.width = '30vw';
eventTitle.style.marginLeft = '30px';
eventTitle.className = 'form-control';
eventDiv.appendChild(eventTitle);
calendarPopup.appendChild(eventDiv);

//Session type
let inputGroup = document.createElement('div')
inputGroup.className = 'input-group-text'
inputGroup.appendChild(document.createTextNode('Session Type'))
inputGroup.for = 'inputgroup1'
let formSelect = document.createElement('select')
formSelect.className = 'form-select'
formSelect.id = 'inputgroup1'
let sessionType = document.createElement('option')
sessionType.value = 'Headset'
sessionType.appendChild(document.createTextNode('Headset'))
formSelect.appendChild(sessionType)
sessionType = document.createElement('option')
sessionType.value = 'Demo Session'
sessionType.appendChild(document.createTextNode('Demo Session'))
formSelect.appendChild(sessionType)
sessionType = document.createElement('option')
sessionType.value = 'Personal'
sessionType.appendChild(document.createTextNode('Personal'))
inputGroup.appendChild(formSelect)
calendarPopup.appendChild(inputGroup)

//Start date
const startDateContainer = document.createElement('div');
const startDateLabel = document.createElement('label');
startDateLabel.for = 'start-date';
let startDateTitle = document.createTextNode('Start');
startDateLabel.appendChild(startDateTitle);
const startDateElement = document.createElement('input');
startDateElement.id = 'start-date';
startDateElement.type = 'datetime-local';
startDateContainer.appendChild(startDateLabel);
startDateContainer.appendChild(startDateElement);
calendarPopup.appendChild(startDateContainer);

//End date 
const endDateContainer = document.createElement('div');
const endDateLabel = document.createElement('label');
endDateLabel.for = 'end-date';
let endDateTitle = document.createTextNode('end');
endDateLabel.appendChild(endDateTitle);
const endDateElement = document.createElement('input');
endDateElement.id = 'end-date';
endDateElement.type = 'datetime-local';
endDateContainer.appendChild(endDateLabel);
endDateContainer.appendChild(endDateElement);
calendarPopup.appendChild(endDateContainer);



const appLoc = 'en-US'
const appTimeZone = 'America/Chicago'
const appName = 'vitanya-booking-app'
const { green, blue, grey } = {
    green: { rgb: [123, 194, 78], hex: '#7bc24e' },
    blue: { rgb: [28, 24, 68], hex: '#1c1844' },
    grey: { rgb: [89, 88, 90], hex: '#59585a' },
}

let loginUser
let coachId
let isCoach = false
let prefTimeZone
let now = new moment()
let localTimeZone = moment.tz.guess()
let appLocalOffset = (now.tz(localTimeZone).utcOffset() - now.tz(appTimeZone).utcOffset()) * 60 * 1000
let prefLocalOffset
let appPrefOffset
let sessionTypes

// SDK init
const sdkInit = ZOHO.CREATOR.init()
const sdkUtil =ZOHO.CREATOR.UTIL
const recOps = ZOHO.CREATOR.API

document.addEventListener('DOMContentLoaded', () => {
    let calendar = new FullCalendar.Calendar(calendarContainer, {
        themeSystem: 'bootstrap',
        aspectRatio: 1.45,
        droppable: true,
        weekends: true,
        headerToolbar: {
            right: 'prev,next',
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        editable: true,
        initialView: 'timeGridWeek',
        dayHeaders: true,
        handleWindowResize: true,
        selectable: true,
        selectMirror: true,
        locale: appLoc,
        timeZone: appTimeZone,
        select: ({start, end}) => {
            let modal = document.getElementById('modalCreate')
            let modalBd = document.getElementById('modalCreateBd')
            modalBd.appendChild(calendarPopup)
            const dialog = new bootstrap.Modal(modal)
            dialog.show()
        },
        eventDrop: ({ event: { id, start, end } }) => { 
            // Update event
            updateEvent(id, start, end)
        },
        eventClick: (info) => {
            let modal = document.getElementById('modalView')
            let modalBd = document.getElementById('modalViewBd')
            const dialog = new bootstrap.Modal(modal)
            dialog.show()
        },
        eventResize: ({ event: { start, end } }) => {
            return
        }
    })

    const createEvent = (start, end) => {
        
        sdkInit.then(()=>{
            console.log("Beginning of event creation");
        }) 
    }

    const updateEvent = (recordId, start, end) => {
        console.log(Date.parse(start))
        console.log(start)
        let startCorrected = new Date(Date.parse(start) - appLocalOffset)
        startCorrected = moment(startCorrected).format('DD-MMM-YYYY hh:mm:ss A')
        let endCorrected = new Date(Date.parse(end) - appLocalOffset)
        endCorrected = moment(endCorrected).format('DD-MMM-YYYY hh:mm:ss A')
        console.log(startCorrected.toString())
        console.log(endCorrected.toString())
        sdkInit.then(() => {
            let formData = {
                data: {
                    Start: startCorrected.toString(),
                    End: endCorrected.toString(),
                }
            }
            let config = {
                ppName: appName,
                reportName: 'All_Appointments',
                id: recordId,
                data: formData,
            }
            recOps.updateRecord(config).then((res) => {
                console.log(`successfully updated record: ${JSON.stringify(res)}`)
            })
        })
    }

    const populateEvents = () => {
        let events
        sdkInit.then(() => {
            loginUser = sdkUtil.getInitParams().loginUser
            let config = {
                appName: appName,
                reportName: 'My_Info',
                criteria: `(users.Email == \"${loginUser}\")`,
                pageSize: '1',
                page: '1'
            }
            recOps.getAllRecords(config).then((res) => {
                let client = res.data[0]
                let clientId = client.Client
                
                // let isClient = true
                prefTimeZone = client.Time_Zone
                debugContainer.innerHTML += `App timezone: ${appTimeZone}<br>`
                debugContainer.innerHTML += `User's preferred timezone: ${prefTimeZone}<br>`
                calendar.setOption('timeZone', prefTimeZone)
            }).then(() => {
                config.reportName = 'All_Appointments'
                config.criteria = `(Client == ${clientId})`
                
                config.pageSize = '200'
                config.page = '1'
                recOps.getAllRecords(config).then((res) => {
                    prefLocalOffset = now.tz(prefTimeZone).utcOffset() * 60 * 1000
                    appPrefOffset = appLocalOffset - prefLocalOffset
                    res.data.forEach((event) => {
                        let start = new Date(Date.parse(event.Start))
                        let end = new Date(Date.parse(event.End))
                        calendar.addEvent({
                            id: event.ID,
                            start: start,
                            end: end,
                        })
                    })
                })
            })
        })
    }

    populateEvents()
    calendar.render()
})