import React, { Component } from 'react';
import './styles.scss';

import Header from '../Header';
import Table from '../../components/Table/Table';
import constants from '../../utils/constants';
import { Link } from 'react-router-dom';
import { get, remove } from '../../utils/api';
import { uriConnectDefinitions, uriDeleteDefinition } from '../../utils/endpoints';
import CodeViewModal from '../../components/Modal/CodeViewModal/CodeViewModal';
import ConfirmModal from '../../components/Modal/ConfirmModal/ConfirmModal';
import AceEditor from 'react-ace';

class ConnectList extends Component {
  state = {
    clusterId: '',
    connectId: '',
    tableData: [],
    showConfigModal: false,
    configModalBody: '',
    showDeleteModal: false,
    definitionToDelete: '',
    deleteMessage: '',
    roles: JSON.parse(localStorage.getItem('roles'))
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const clusterId = nextProps.match.params.clusterId;
    const connectId = nextProps.match.params.connectId;

    return {
      clusterId: clusterId,
      connectId: connectId
    };
  }

  componentDidMount() {
    this.getConnectDefinitions();
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.location.pathname !== prevProps.location.pathname) {
        this.getConnectDefinitions();
    }
  }

  async getConnectDefinitions() {
    let connectDefinitions = [];
    const { clusterId, connectId } = this.state;
    const { history } = this.props;
    history.replace({
      ...this.props.location,
      loading: true
    });
    try {
      connectDefinitions = await get(uriConnectDefinitions(clusterId, connectId));
      this.handleData(connectDefinitions.data);
      this.setState({ selectedCluster: clusterId });
      history.replace({
        ...this.props.location,
        loading: false
      });
    } catch (err) {
      history.replace({
        loading: false
      });
    }
  }

  deleteDefinition = () => {
    const { clusterId, connectId, definitionToDelete: definition } = this.state;
    const { history } = this.props;
    history.replace({ loading: true });
    remove(uriDeleteDefinition(clusterId, connectId, definition))
      .then(() => {
        this.props.history.replace({
          ...this.props.location,
          showSuccessToast: true,
          successToastMessage: `Definition '${definition}' is deleted`,
          loading: false
        });
        this.setState({ showDeleteModal: false, definitionToDelete: '' }, () => {
          this.getConnectDefinitions();
        });
      })
      .catch(() => {
        this.props.history.replace({
          ...this.props.location,
          showErrorToast: true,
          errorToastMessage: `Failed to delete definition from '${definition}'`,
          loading: false
        });
        this.setState({ showDeleteModal: false, topicToDelete: {} });
      });
  };

  handleData = data => {
    let tableData = [];
    tableData = data.map(connectDefinition => {
      return {
        id: connectDefinition.name || '',
        config: JSON.stringify(connectDefinition.configs) || '',
        type:
          {
            type: connectDefinition.type,
            shortClassName: connectDefinition.shortClassName
          } || '',
        tasks: connectDefinition.tasks || ''
      };
    });

    this.setState({ tableData });
  };

  showConfigModal = body => {
    this.setState({
      showConfigModal: true,
      configModalBody: body
    });
  };

  closeConfigModal = () => {
    this.setState({ showConfigModal: false, configModalBody: '' });
  };

  showDeleteModal = deleteMessage => {
    this.setState({ showDeleteModal: true, deleteMessage });
  };

  closeDeleteModal = () => {
    this.setState({ showDeleteModal: false, deleteMessage: '' });
  };

  getTableActions = () => {
    const roles = this.state.roles || {};
    let actions = [];

    if (roles.connect && roles.connect['connect/update']) {
      actions.push(constants.TABLE_DETAILS);
    }
    if (roles.connect && roles.connect['connect/delete']) {
      actions.push(constants.TABLE_DELETE);
    }

    return actions;
  };

  handleOnDelete(definition) {
    this.setState({ definitionToDelete: definition }, () => {
      this.showDeleteModal(
        <React.Fragment>
          Do you want to delete definition: {<code>{definition}</code>} ?
        </React.Fragment>
      );
    });
  }

  renderTasks = tasks => {
    let renderedTasks = [];

    for (let task of tasks) {
      let className = 'btn btn-sm mb-1 btn-';
      switch (task.state) {
        case 'RUNNING':
          className += 'success';
          break;
        case 'FAILED':
          className += 'danger';
          break;
        default:
          className += 'warning';
          break;
      }

      renderedTasks.push(
        <React.Fragment>
          <span className={`btn btn-sm mb-1 ${className}`}>
            {`${task.workerId} (${task.id}) `}
            <span className="badge badge-light">{task.state}</span>
          </span>
          <br />
        </React.Fragment>
      );
    }

    return renderedTasks;
  };

  render() {
    const { clusterId, connectId, tableData, showConfigModal, configModalBody } = this.state;
    const roles = this.state.roles || {};
    const { history } = this.props;

    return (
      <div>
        <Header title={`Connect: ${connectId}`} history={history} />
        <Table
          columns={[
            {
              id: 'id',
              name: 'id',
              accessor: 'id',
              colName: 'Name',
              type: 'text',
              sortable: true
            },
            {
              id: 'config',
              name: 'config',
              accessor: 'config',
              colName: 'Config',
              type: 'text',
              extraRow: true,
              extraRowContent: (obj, col, index) => {
                return (
                  <AceEditor
                    mode="json"
                    id={'value' + index}
                    theme="merbivore_soft"
                    value={obj[col.accessor]}
                    readOnly
                    name="UNIQUE_ID_OF_DIV"
                    editorProps={{ $blockScrolling: true }}
                    style={{ width: '100%', minHeight: '25vh' }}
                  />
                );
              },
              cell: (obj, col) => {
                return (
                  <pre class="mb-0 khq-data-highlight">
                    <code onClick={() => JSON.stringify(JSON.parse(obj[col.accessor]), null, 2)}>
                      {obj[col.accessor] ? obj[col.accessor].substring(0, 100) : 'N/A'}
                      {obj[col.accessor] && obj[col.accessor].length > 100 && '(...)'}
                    </code>
                  </pre>
                );
              }
            },
            {
              id: 'type',
              accessor: 'type',
              colName: 'Type',
              type: 'text',
              cell: (obj, col) => {
                if (obj[col.accessor].type === 'source') {
                  return (
                    <React.Fragment>
                      <i className="fa fa-forward" aria-hidden="true" />
                      {` ${obj[col.accessor].shortClassName}`}
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment>
                    <i className="fa fa-backward" aria-hidden="true" />
                    {` ${obj[col.accessor].shortClassName}`}
                  </React.Fragment>
                );
              }
            },
            {
              id: 'tasks',
              accessor: 'tasks',
              colName: 'Tasks',
              type: 'text',
              cell: (obj, col) => {
                return this.renderTasks(obj[col.accessor]);
              }
            }
          ]}
          data={tableData}
          updateData={data => {
            this.setState({ tableData: data });
          }}
          actions={this.getTableActions()}
          onDetails={name => {
            history.push({
              pathname: `/ui/${clusterId}/connect/${connectId}/definition/${name}`,
              clusterId,
              connectId,
              definitionId: name
            });
          }}
          onDelete={row => {
            this.handleOnDelete(row.id);
          }}
          extraRow
          noStripes
          onExpand={obj => {
            return Object.keys(obj.headers).map(header => {
              return (
                <tr
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%'
                  }}
                >
                  <td
                    style={{
                      width: '100%',
                      display: 'flex',
                      borderStyle: 'dashed',
                      borderWidth: '1px',
                      backgroundColor: '#171819'
                    }}
                  >
                    {header}
                  </td>
                  <td
                    style={{
                      width: '100%',
                      display: 'flex',
                      borderStyle: 'dashed',
                      borderWidth: '1px',
                      backgroundColor: '#171819'
                    }}
                  >
                    {obj.headers[header]}
                  </td>
                </tr>
              );
            });
          }}
          noContent={'No connectors available'}
        />
        {roles.connect && roles.connect['connect/insert'] && (
          <aside>
            <Link to={`/ui/${clusterId}/connect/${connectId}/create`} className="btn btn-primary">
              Create a definition
            </Link>
          </aside>
        )}
        <ConfirmModal
          show={this.state.showDeleteModal}
          handleCancel={this.closeDeleteModal}
          handleConfirm={this.deleteDefinition}
          message={this.state.deleteMessage}
        />
        <CodeViewModal
          show={showConfigModal}
          body={configModalBody}
          handleClose={this.closeConfigModal}
        />
      </div>
    );
  }
}

export default ConnectList;