import {
  CAlert,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
  CCol,
  CRow,
  CForm,
  CTextarea,
  CInvalidFeedback,
  CInputFile,
  CPopover,
  CSelect,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilX } from '@coreui/icons';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import 'react-widgets/styles.css';
import { useAuth, useDevice, useToast } from 'ucentral-libs';
import axiosInstance from 'utils/axiosInstance';
import eventBus from 'utils/eventBus';
import SuccessfulActionModalBody from 'components/SuccessfulActionModalBody';

const ScriptModal = ({ show, toggleModal }) => {
  const { t } = useTranslation();
  const { currentToken, endpoints } = useAuth();
  const { addToast } = useToast();
  const { deviceSerialNumber } = useDevice();
  const [hadSuccess, setHadSuccess] = useState(false);
  const [hadFailure, setHadFailure] = useState(false);
  const [doingNow, setDoingNow] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [scriptType, setScriptType] = useState('');
  const [newScript, setNewScript] = useState('');
  const [responseBody, setResponseBody] = useState('');
  const [checkingIfSure, setCheckingIfSure] = useState(false);
  const [errorJson, setErrorJson] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  let fileReader;

  const confirmingIfSure = () => {
    if (newScript) {
      setCheckingIfSure(true);
    } else {
      setErrorJson(true);
    }
  };

  useEffect(() => {
    setHadSuccess(false);
    setHadFailure(false);
    setWaiting(false);
    setResponseBody('');
    setCheckingIfSure(false);
    setDoingNow(false);
    setNewScript('');
    setErrorJson(false);
    setInputKey(0);
  }, [show]);

  useEffect(() => {
    setErrorJson(false);
  }, [newScript]);

  const doAction = (isNow) => {
    setDoingNow(isNow);
    setHadFailure(false);
    setHadSuccess(false);
    setWaiting(true);

    const parameters = {
      serialNumber: deviceSerialNumber,
      timeout: 30,
      type: scriptType,
      when: 0,
      scriptId: 1,
      script: newScript,
    };

    const headers = {
      Accept: 'application/octet-stream',
      Authorization: `Bearer ${currentToken}`,
    };

    axiosInstance
      .post(
        `${endpoints.owgw}/api/v1/device/${encodeURIComponent(deviceSerialNumber)}/script`,
        parameters,
        { headers },
      )
      .then(() => {
        addToast({
          title: t('common.success'),
          body: t('commands.command_success'),
          color: 'success',
          autohide: true,
        });
        toggleModal();
      })
      .catch((e) => {
        setResponseBody('Error while submitting command!');
        addToast({
          title: t('common.error'),
          body: `${t('common.general_error')}: ${e.response?.data?.ErrorDescription}`,
          color: 'danger',
          autohide: true,
        });
        setHadFailure(true);
      })
      .finally(() => {
        setDoingNow(false);
        setCheckingIfSure(false);
        setWaiting(false);
        eventBus.dispatch('actionCompleted', { message: 'An action has been completed' });
      });
  };

  const handleJsonRead = () => {
    setErrorJson(false);
    const content = fileReader.result;
    if (content) {
      setNewScript(content); 
    } else {
      setErrorJson(true);
    }
  };

  const handleScriptFile = (file) => {
    fileReader = new FileReader();
    fileReader.onloadend = handleJsonRead;
    fileReader.readAsText(file);
  };

  const resetText = () => {
    setInputKey(inputKey + 1);
    setNewScript('');
  };

  return (
    <CModal show={show} onClose={toggleModal} size="lg">
      <CModalHeader className="p-1">
        <CModalTitle className="pl-1 pt-1">{t('script.title')}</CModalTitle>
        <div className="text-right">
          <CPopover content={t('common.close')}>
            <CButton color="primary" variant="outline" className="ml-2" onClick={toggleModal}>
              <CIcon content={cilX} />
            </CButton>
          </CPopover>
        </div>
      </CModalHeader>
      {hadSuccess ? (
        <SuccessfulActionModalBody toggleModal={toggleModal} />
      ) : (
        <div>
          <CModalBody>
            <CRow>
              <CCol md="10" className="mt-1">
                <h6>{t('script.enter_new')}</h6>
              </CCol>
              <CCol>
                <CButton
                  type="reset"
                  size="sm"
                  onClick={resetText}
                  color="danger"
                  variant="outline"
                >
                  {t('common.clear')}
                </CButton>
              </CCol>
            </CRow>
            <CRow className="mt-2">
              <CCol md="3">
                <p className="pl-2">{t('script.type')}</p>
              </CCol>
              <CCol>
                <CSelect
                  custom
                  value={scriptType}
                  onChange={(e) => setScriptType(e.target.value)}
                  style={{ width: '100px' }}
                >
                  <option value="shell">Shell</option>
                  <option value="uci">UCI</option>
                  <option value="ucode">ucode</option>
                </CSelect>
              </CCol>
            </CRow>
            <CRow className="mt-3">
              <CCol>
                <CForm>
                  <CTextarea
                    name="textarea-input"
                    id="textarea-input"
                    rows="9"
                    placeholder={t('script.placeholder')}
                    value={newScript}
                    onChange={(event) => setNewScript(event.target.value)}
                    invalid={errorJson}
                  />
                  <CInvalidFeedback className="help-block">
                    {t('script.valid_json')}
                  </CInvalidFeedback>
                </CForm>
              </CCol>
            </CRow>
            <CRow className="mt-4">
              <CCol>{t('script.choose_file')}</CCol>
              <CCol>
                <CInputFile
                  id="file-input"
                  name="file-input"
                  accept=".sh, .uc"
                  onChange={(e) => handleScriptFile(e.target.files[0])}
                  key={inputKey}
                />
              </CCol>
            </CRow>
            <CAlert color="danger" hidden={!hadSuccess && !hadFailure}>
              {responseBody}
            </CAlert>
          </CModalBody>
          <CModalFooter>
            <div hidden={!checkingIfSure}>Are you sure?</div>
            <CButton
              disabled={waiting}
              hidden={checkingIfSure}
              color="primary"
              onClick={confirmingIfSure}
            >
              {t('common.save')}
            </CButton>
            <CButton
              hidden={!checkingIfSure}
              disabled={waiting}
              color="primary"
              onClick={() => doAction(false)}
            >
              {waiting && !doingNow ? t('common.saving') : t('common.yes')} {'   '}
              <CSpinner color="light" hidden={!waiting || doingNow} component="span" size="sm" />
            </CButton>
            <CButton color="secondary" onClick={toggleModal}>
              {t('common.cancel')}
            </CButton>
          </CModalFooter>
        </div>
      )}
    </CModal>
  );
};

ScriptModal.propTypes = {
  show: PropTypes.bool.isRequired,
  toggleModal: PropTypes.func.isRequired,
};

export default ScriptModal;
