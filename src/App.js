import React from 'react';
import {FaAdjust} from 'react-icons/fa'
import InfiniteScroll from 'react-infinite-scroller';
import TextareaAutosize from 'react-textarea-autosize'
import Autosuggest from 'react-autosuggest';
import './App.css';

async function readKey() {
  return await fetch('./api.config').then((response) => {
    return response.json();
  }).then(kv => {return kv.key});
}

const SPREADSHEET_ID = '1AJO52gUTAElYGcfGMK07YkEfWdYNEITkjzS8hhOFTww';

function Semester2Num(date) {
  var arr = date.toLowerCase().split(/\s+/);
  if (arr.length >=2) {
    var sem = arr[0];
    var year = parseInt(arr[1]);
    if (isNaN(year)) {return 0;}
    if (sem == "spring") {
      return year + 0.1;
    }
    if (sem == "summer") {
      return year + 0.2;
    }
    if (sem == "fall") {
      return year + 0.3;
    }
    return year + 0.4;
  }
  return 0;
}

function Review(props){
  var reviewer = props.reviewer ? <p><b>Reviewer: </b>{props.reviewer}</p> : null;
  var misc = props.misc ? <p><b>Miscellaneous: </b>{props.misc}</p> : null;
  return (
    <div className="review">
      <h2>{props.coursenum} {props.coursename} <br />
      Prof. {props.prof}, {props.date}</h2>
      {reviewer}
      <p><b>Difficulty: </b>{props.difficulty}</p>
      <p><b>Workload: </b>{props.workload}</p>
      <p><b>Lectures: </b>{props.lecture}</p>
      {misc}
    </div>
  );
}

class ReviewReader extends React.Component {

  constructor(props) {
    super(props);
    var allDeptNames = new Map();
    var allCoursenums = new Map();
    var allProfs = new Map();
    for (let review of props.reviews) {
      let dept = review.dept;
      if (allDeptNames.has(dept)) {
        allDeptNames.get(dept).push(review)
      } else {
        allDeptNames.set(dept, [review])
      }
      let cn = review.coursenum;
      if (allCoursenums.has(cn)) {
        allCoursenums.get(cn).push(review)
      } else {
        allCoursenums.set(cn, [review])
      }
      let prof = review.prof;
      if (allProfs.has(prof)) {
        allProfs.get(prof).push(review)
      } else {
        allProfs.set(prof, [review])
      }
    }
    this.allDeptNames = allDeptNames
    this.allCoursenums = allCoursenums;
    this.allProfs = allProfs;
    this.deptList = Array.from(this.allDeptNames.keys()).sort();
    this.state = {
      dept: "",
      course: "",
      prof: "",
      search: "",
      availProfs: Array.from(this.allProfs.keys()).sort(),
      availCourses: Array.from(this.allCoursenums.keys()).sort(),
      availReviews: this.props.reviews,
      numRevShown: 20
    }
  }

  deptChange(e) {
    this.setState({dept: e.target.value, course: "", prof: ""});
    this.setState((state) => this.updateReviews(state));
  }

  courseChange(e) {
    if (this.state.dept == "") {
      let dept = this.allCoursenums.get(e.target.value)[0].dept;
      this.setState({dept: dept, course: e.target.value});
    } else {
      this.setState({course: e.target.value});
    }
    this.setState((state) => this.updateReviews(state));
  }

  profChange(e) {
    if (this.state.dept == "") {
      let dept = this.allProfs.get(e.target.value)[0].dept;
      this.setState({dept: dept, prof: e.target.value});
    } else {
      this.setState({prof: e.target.value});
    }
    this.setState((state) => this.updateReviews(state));
  }

  searchChange(e) {
    this.setState({search: e.target.value});
    this.setState((state) => this.updateReviews(state));
  }

  matches(review, search) {
    search = search.toLowerCase();
    return review.coursename.toLowerCase().includes(search) ||
            review.prof.toLowerCase().includes(search) ||
            review.reviewer.toLowerCase().includes(search) ||
            review.coursenum.toLowerCase().includes(search) ||
            review.date.toLowerCase().includes(search);
  }

  updateReviews(state) {
    var reviews = this.props.reviews;
    var availCourses;
    var availProfs;
    if (state.dept == "") {
      availCourses = Array.from(this.allCoursenums.keys()).sort();
      availProfs = Array.from(this.allProfs.keys()).sort();
    } else {
      reviews = this.allDeptNames.get(state.dept);
      availCourses = reviews.filter(review => {
          return state.prof == "" || review.prof == state.prof
        }).map(review => {
          return review.coursenum;
      });
      availProfs = reviews.filter(review => {
          return state.course == "" || review.coursenum == state.course
        }).map(review => {
          return review.prof;
      });
      availCourses = Array.from(new Set(availCourses)).sort();
      availProfs = Array.from(new Set(availProfs)).sort();
    }
    reviews = reviews.filter(review => {
      return (state.prof == "" || review.prof == state.prof)
        && (state.course == "" || review.coursenum == state.course)
        && (state.search == "" || this.matches(review, state.search));
    });
    return ({availCourses: availCourses, availProfs: availProfs,
      availReviews: reviews, numRevShown: 20})
  }

  loadMoreReviews() {
    if (this.state.numRevShown + 20 < this.state.availReviews.length) {
      this.setState(state => ({
        numRevShown: state.numRevShown + 20
      }));
    }
    else {
      this.setState(state => ({
        numRevShown: state.availReviews.length
      }));
    }
  }

  render() {
    return (
      <div className="review-reader">
        <select className='selector' value={this.state.dept} onChange={this.deptChange.bind(this)}>
          <option key="" value=""> [All departments] </option>
          {this.deptList.map(deptname =>
            <option key={deptname}>{deptname}</option>
            )}
        </select>
        <select className='selector' value={this.state.course} onChange={this.courseChange.bind(this)}>
          <option key="" value=""> [All courses] </option>
          {this.state.availCourses.map(cn =>
            <option key={cn}>{cn}</option>
          )}
        </select>
        <select className='selector' value={this.state.prof} onChange={this.profChange.bind(this)}>
          <option key="" value=""> [All professors] </option>
          {this.state.availProfs.map(prof =>
            <option key={prof}>{prof}</option>
          )}
        </select>
        <input className='selector' type="text" placeholder="Search to filter results" onChange={this.searchChange.bind(this)}/>
        <InfiniteScroll
            pageStart={0}
            loadMore={this.loadMoreReviews.bind(this)}
            hasMore={this.state.availReviews.length != this.state.numRevShown}
            loader={<div className="loader" key={0}>Loading ...</div>}
        >
            {this.state.availReviews.slice(0, this.state.numRevShown).map(review => <Review key={review.reviewID} {...review}/>)}
        </InfiniteScroll>
      </div>
    );
  }
}

class ReviewWriter extends React.Component {
  constructor(props) {
    super(props);
    this.allDepts = Array.from(new Set(props.reviews.map(rev => rev.dept))).sort();
    this.allProfs = Array.from(new Set(props.reviews.map(rev => rev.prof))).sort()
    this.allCourseNames = Array.from(new Set(props.reviews.map(rev => rev.coursename))).sort();
    var deptMap = new Map();
    for (let review of props.reviews) {
      let dept = review.dept;
      if (deptMap.has(dept)) {
        deptMap.get(dept).profs.add(review.prof);
        deptMap.get(dept).coursenames.add(review.coursename);
      } else {
        deptMap.set(dept, {profs: new Set([review.prof]),
                           coursenames: new Set([review.coursename])});
      }
    }
    deptMap.forEach((v, k, map) => {
      map.set(k, {profs: Array.from(v.profs).sort(),
                  coursenames: Array.from(v.coursenames).sort()});
    });
    this.deptMap = deptMap;

    var today = new Date();
    this.dates = []
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    for (var i=0; i<12; i++) {
      if (month > 8 || month < 2) {
        this.dates.push(`Fall ${year}`);
        month = 8;
      }
      else if (month > 6) {
        this.dates.push(`Summer ${year}`);
        month = 6;
        }
      else {
        this.dates.push(`Spring ${year}`);
        month = 10;
        year -= 1;
      }
    }

    var formElems = {
      reviewerInp: "",
      deptSelect: "",
      coursenumInp: "",
      coursenameInp: "",
      profInp: "",
      dateSelect: this.dates[0],
      difficultyBox: "",
      workloadBox: "",
      lectureBox: "",
      miscBox: ""
    };
    for (let elem in formElems) {
      if(localStorage.getItem(elem)){
        formElems[elem] = localStorage.getItem(elem);
      }
    }

    var availProfs;
    var availCourseNames;
    const dept = formElems.deptSelect;
    if (dept == "") {
      availProfs = this.allProfs;
      availCourseNames = this.allCourseNames;
    } else {
      availProfs = Array.from(this.deptMap.get(dept).profs);
      availCourseNames = Array.from(this.deptMap.get(dept).coursenames);
    }

    this.state = {
      availProfs: availProfs,
      availCourseNames: availCourseNames,
      ...formElems
    }
  }
  
  deptChange(e) {
    const dept = e.target.value;
    this.setState({availProfs: Array.from(this.deptMap.get(dept).profs),
                  availCourseNames: Array.from(this.deptMap.get(dept).coursenames)});
    this.inputChangeHandler(e);
  }

  inputChangeHandler(e) {
    this.setState({ [e.target.id]: e.target.value });
    localStorage.setItem(e.target.id, e.target.value);
  }

  async submitReview() {
    if (this.state.deptSelect == "" || this.state.coursenumInp == "" ||
        this.state.coursenameInp == "" || this.state.profInp == "" || this.state.dateSelect == "") {
      alert("Please fill out all required fields.");
      return;
    }

    var review = {
      dept: this.state.deptSelect.trim(),
      coursenum: this.state.coursenumInp.trim(),
      coursename: this.state.coursenameInp.trim(),
      prof: this.state.profInp.trim(),
      date: this.state.dateSelect.trim(),
      datenum: Semester2Num(this.state.dateSelect.trim()),
      difficulty: this.state.difficultyBox.trim(),
      workload: this.state.workloadBox.trim(),
      lecture: this.state.lectureBox.trim(),
      misc: this.state.miscBox.trim(),
      reviewer: this.state.reviewerInp.trim(),
    };
    var rangeData = {
      values: [
        [review.coursenum,
         review.coursename,
         review.prof,
         review.date,
         review.difficulty,
         review.workload,
         review.lecture,
         review.misc,
         review.reviewer
        ]
      ]
    };
    var review_data = {
      dept: this.state.deptSelect,
      rangeData: rangeData
    }
    fetch('/submit', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(review_data)
    }).then(response => {
      if (response.ok) {
        var formElems = {
          reviewerInp: "",
          deptSelect: "",
          coursenumInp: "",
          coursenameInp: "",
          profInp: "",
          dateSelect: this.dates[0],
          difficultyBox: "",
          workloadBox: "",
          lectureBox: "",
          miscBox: ""
        };
        for (let key in formElems) {
          localStorage.removeItem(key);
        }
        var availProfs = this.allProfs;
        var availCourseNames = this.allCourseNames;
        this.setState({
          availProfs: availProfs,
          availCourseNames: availCourseNames,
          ...formElems
        });
        this.props.updateReviews(review);
      } else {
        alert("Sorry! Not sure why, but the review could not be sent. Try again later?");
        console.error('error: ' + response);
      }      
    }, function(reason) {
      alert("Sorry! Not sure why, but my server isn't working. Try again later?");
      console.error('error: ' + reason.result.error.message);
    });
  }

  render() {
    return (
      <div className="review-writer">
        <label htmlFor="reviewerInp">Reviewer (optional): </label>
        <input className="selector" id="reviewerInp" onChange={this.inputChangeHandler.bind(this)} value={this.state.reviewerInp}/>
        <label htmlFor="deptSelect">*Department: </label>
        <select id="deptSelect" className='selector' required onChange={this.deptChange.bind(this)} value={this.state.deptSelect}>
          <option disabled></option>
          {this.allDepts.map(deptname =>
            <option key={deptname}>{deptname}</option>
          )}
        </select>
        <label htmlFor="coursenumInp">*Course number (e.g. UGS 303): </label>
        <input className="selector" id="coursenumInp" required onChange={this.inputChangeHandler.bind(this)} value={this.state.coursenumInp}/>
        <label htmlFor="coursenameInp">*Course name: </label>
        <input className="selector" id="coursenameInp" required list="coursename" onChange={this.inputChangeHandler.bind(this)} value={this.state.coursenameInp}/>  
          <datalist id="coursename">
            {this.state.availCourseNames.map(cn =>
              <option key={cn} value={cn}/>
            )}
          </datalist>
        <label htmlFor="profInp">*Professor (last name): </label>
        <input className="selector" id="profInp" required list="prof" onChange={this.inputChangeHandler.bind(this)} value={this.state.profInp}/>
          <datalist id="prof">
            {this.state.availProfs.map(prof =>
              <option key={prof} value={prof}/>
            )}
          </datalist>
        <label htmlFor="dateSelect">*Date taken: </label>
        <select id="dateSelect" className='selector' required onChange={this.inputChangeHandler.bind(this)} value={this.state.dateSelect}>
          {this.dates.map(date =>
            <option key={date}>{date}</option>
          )}
        </select>
        <label htmlFor="difficultyBox">Difficulty: </label>
        <TextareaAutosize
          id="difficultyBox"
          style={{width:"90%", resize:"none"}}
          minRows={5}
          maxRows={15}
          placeholder="How hard are the concepts/workload? Is it hard to get a good grade? Etc."
          className="selector"
          onChange={this.inputChangeHandler.bind(this)}
          value={this.state.difficultyBox}
        />
        <label htmlFor="workloadBox">Workload: </label>
        <TextareaAutosize
          id="workloadBox"
          style={{width:"90%", resize:"none"}}
          minRows={5}
          maxRows={15}
          placeholder="What types of assignments are there? How many hours a week do they take? Etc."
          className="selector"
          onChange={this.inputChangeHandler.bind(this)}
          value={this.state.workloadBox}
        />
        <label htmlFor="lectureBox">Lectures: </label>
        <TextareaAutosize
          id="lectureBox"
          style={{width:"90%", resize:"none"}}
          minRows={5}
          maxRows={15}
          placeholder="How were lectures? Worth/required to go to class? Etc."
          className="selector"
          onChange={this.inputChangeHandler.bind(this)}
          value={this.state.lectureBox}
        />
        <label htmlFor="miscBox">Miscellaneous: </label>
        <TextareaAutosize
          id="miscBox"
          style={{width:"90%", resize:"none"}}
          minRows={5}
          maxRows={15}
          className="selector"
          onChange={this.inputChangeHandler.bind(this)}
          value={this.state.miscBox}
        />
        <button type="submit" id='submitButton' className={this.state.darkMode ? 'dark-mode': null} onClick={this.submitReview.bind(this)}>Submit!</button>
        <div style={{minHeight: "20vh"}}/>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    var darkmode;
    if(localStorage.getItem("theme") == "dark"){
      darkmode = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      darkmode = false;
      document.documentElement.setAttribute('data-theme', 'light');
    }
    this.state = {
      isLoading: true,
      readMode: true,
      reviews: [],
      darkMode: darkmode
    };
  }

  addReview(rev) {
    this.setState(state => {
      rev.reviewID = state.reviews.length;
      var newReviews = [...state.reviews, rev];
      newReviews.sort((rev1, rev2) => rev2.datenum - rev1.datenum);
      return {reviews: newReviews};
    });    
  }

  readData2() {
    fetch('./reviews.json').then((response) => {
      return response.json();
    }).then((reviews) => {
      this.setState({reviews: reviews, isLoading: false});
    })
  }

  async readData() {
    const API_KEY = await readKey();
    window.gapi.client.init({
      apiKey: API_KEY
    }).then(() => {
        // GoogleAuth = window.gapi.auth2.getAuthInstance();
        var path = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`
        return window.gapi.client.request({
            "path": path,
            "method": "GET",
            "params": {
                "key": API_KEY
            }
        });
    }).then((response) => {
      var sheets = response.result.sheets.filter(sheet => sheet.properties.title != "FRI");
      var titles = Array.from(sheets, sheet => (sheet.properties.title));
      var data = Array.from(sheets, sheet => {
        var title = sheet.properties.title;
        var path = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${title}`
        return window.gapi.client.request({
          path: path,
          method: "GET",
          params: {
              key: API_KEY
          }
        });
      });
      Promise.all(data).then((data) => {
        var reviews = [];
        let revCount = 0;
        for (let i=0; i<data.length; i++) {
          let sheet = data[i].result.values.slice(2);
          for (var row of sheet) {
            if (row.length < 9) {
              let l = 9 - row.length
              row.push(...Array.from({length: l}, () => ""))
            }
            var rev = {
              dept: titles[i].trim(),
              coursenum: row[0].trim(),
              coursename: row[1].trim(),
              prof: row[2].trim(),
              date: row[3].trim(),
              datenum: Semester2Num(row[3].trim()),
              difficulty: row[4].trim(),
              workload: row[5].trim(),
              lecture: row[6].trim(),
              misc: row[7].trim(),
              reviewer: row[8].trim(),
              reviewID: `rev${revCount}`
            };
            reviews.push(rev);
            revCount += 1;
          }
        }
        reviews.sort((rev1, rev2) => rev2.datenum - rev1.datenum);
        this.setState({reviews: reviews, isLoading: false});
      }, (error) => {
        console.log(error)
      })
    }, function(error) {
        console.log(error);
    });
  }

  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => {
      window.gapi.load('client', ()=>{
        this.readData();
      });
    };
    document.body.appendChild(script);
  }

  toggleDarkMode() {
    this.setState(state => {
      if (!state.darkMode) {
        localStorage.setItem('theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      return ({darkMode: !state.darkMode});
    });
  }

  toggleReadMode() {
    this.setState(state => ({readMode: !state.readMode}));
  }
  
  render() {
    if (this.state.isLoading) {
      return (
        <div className='App'>
          <div className='column'>
            <h1>Loading...</h1>
          </div>
        </div>
      );
    }
    var content;
    var btn;
    if (this.state.readMode) {
      content = <ReviewReader reviews={this.state.reviews}></ReviewReader>;
      btn = "Submit a review!";
    } else {
      content = <ReviewWriter reviews={this.state.reviews} updateReviews={this.addReview.bind(this)}></ReviewWriter>;
      btn = "Return to search"
    }
    return (
      <div className='App'>
        <FaAdjust size={32} id='darkmodeButton' onClick={() => this.toggleDarkMode()}/>
        <div className='column'>
          <h1>DS Course Reviews</h1>
          <button id='rwButton' onClick={() => this.toggleReadMode()}>{btn}</button>
          {content}
        </div>
      </div>
    );
  }
}

export default App;
