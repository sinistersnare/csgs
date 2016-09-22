import React from 'react';
import { WithContext as ReactTags, Keys } from 'react-tag-input';
import './App.css';
import $ from 'jquery';

/**
    JS code for the GSCS react app.
    Uses React. Sorry for shit JS, but JS is shit.
*/

/* Used in the tag input for separating tags */
const KeyCodes = {
  ENTER: 13,
  TAB: 9,
  SPACE: 32,
};

function all(fns, server) {
    for (var fn of fns) {
        if (!fn(server)) {
            return false;
        }
    }
    return true;
}

export default class FilterableServerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
      noEmptyCheckBox: false,
      tagInput: [],
      tagSuggestions: []
    }
    this.handleUserInput = this.handleUserInput.bind(this);
    this.setTags = this.setTags.bind(this);
  }

  setTags(tags) {
    this.setState({tagInput: tags});
  }

  handleUserInput(filterText, noEmptyCheckBox) {
    this.setState({
      filterText: filterText,
      noEmptyCheckBox: noEmptyCheckBox
    });
  }
  render() {
    return (
      <div className="filterableServerList">
        <FilterBox
          noEmptyCheckBox={this.state.noEmptyCheckBox}
          filterText={this.state.filterText}
          onUserInput={this.handleUserInput}
          tags={this.state.tagInput}
          suggestions={this.state.tagSuggestions}
          setTags={this.setTags}
        />
        <ServerBox
          url={this.props.url}
          pollInterval={this.props.pollInterval}
          filterText={this.state.filterText}
          noEmptyCheckBox={this.state.noEmptyCheckBox}
          tagInput={this.state.tagInput}
        />
      </div>
    );
  }
}

class FilterBox extends React.Component {
  render() {
    return (
      <div className="filterBox">
        <h1>Search</h1>
        <FilterBar
          noEmptyCheckBox={this.props.noEmptyCheckBox}
          filterText={this.props.filterText}
          onUserInput={this.props.onUserInput}
          tags={this.props.tags}
          suggestions={this.props.suggestions}
          setTags={this.props.setTags}
        />
      </div>
    );
  }
}

class FilterBar extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }
  handleChange() {
    this.props.onUserInput(
      this.refs.filterTextInput.value,
      this.refs.noEmptyCheckBox.checked
    );
  }
  render() {
    return (
      <form>
        <input
          type="text"
          placeholder="Search..."
          ref="filterTextInput"
          value={this.props.filterText}
          onChange={this.handleChange}
        />
        <label>
          <input
            type="checkbox"
            checked={this.props.noEmptyCheckBox}
            ref="noEmptyCheckBox"
            id="no_empty_check_box"
            value="no_empty_check_box"
            onChange={this.handleChange}
          />
          Filter our empty servers.
        </label>
        <TagInput
          tags={this.props.tags}
          suggestions={this.props.suggestions}
          setTags={this.props.setTags}
        />
      </form>
    );
  }
}

class TagInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total: 0,
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleAddition = this.handleAddition.bind(this);
  }
  handleDelete(i) {
    let tags = this.props.tags;
    tags.splice(i, 1);
    this.props.setTags(tags);
  }
  handleAddition(tag) {
    let tags = this.props.tags;
    let total = this.state.total;
    tags.push({
      id: total,
      text: tag
    });
    this.setState({total: total+1});
    this.props.setTags(tags);
  }
  render() {
    let tags = this.props.tags;
    let suggestions = this.props.suggestions;
    return (
      <div className="tagInput">
        <ReactTags
          tags={tags}
          suggestions={suggestions}
          handleDelete={this.handleDelete}
          handleAddition={this.handleAddition}
          placeholder={"Search for tags..."}
          delimiters={[KeyCodes.ENTER, Keys.TAB, KeyCodes.SPACE]}
        />
      </div>
    );
  }
}

class ServerBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      active: false
    }
    this.loadCommentsFromServer = this.loadCommentsFromServer.bind(this);
  }

  loadCommentsFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data, active: true});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }
    });
  }

  componentDidMount() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer.bind(this), this.props.pollInterval);
  }

  render() {
    return (
      <div className="serverBox">
        <h1>Server</h1>
        <ServerList
          data={this.state.data}
          active={this.state.active}
          filterText={this.props.filterText}
          noEmptyCheckBox={this.props.noEmptyCheckBox}
          tagInput={this.props.tagInput}
        />
      </div>
    );
  }
}

class ServerList extends React.Component {
  render() {
    if (!this.props.active) {
      return <div></div>;
    }
    let filters = [];
    let passedServers = [];
    if (this.props.filterText) {
      filters.push(function filterTextFn(txt, server) {
        return server.name.toLowerCase().indexOf(txt.toLowerCase().trim()) !== -1;
      }.bind(this, this.props.filterText));
    }
    if (this.props.noEmptyCheckBox) {
      filters.push(function emptyServerFn(server) {
        return (server.current_users !== 0 || server.current_premium_users !== 0);
      });
    }
    if (this.props.tagInput.length) {
      filters.push(function tagInputFilterFn(tags, server) {
        for (var tag of tags) {
          if (server.tags.map(t => t.toLowerCase()).includes(tag.text.toLowerCase())) {
            return true;
          }
        }
        return false;
      }.bind(this, this.props.tagInput));
    }
    for (var server of this.props.data.results) {
      if (!all(filters, server)) {
        continue;
      }
      passedServers.push(<Server
        key={server.id}
        server={server}
      />);
    }
    return (
      <div className="serverList">
        {passedServers}
      </div>
    );
  }
}

class Server extends React.Component {
  render() {
    var srv = this.props.server;
    var tags = srv.tags.join(', ');
    return (
          <div className="server">
            <b>{srv.region}</b>:
              {srv.name}
              -- {tags} -
              ({srv.current_users}/{srv.max_users})
              <b>({srv.current_premium_users}/{srv.max_premium_users})</b>
          </div>
    );
  }
}
