import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CCol,
  CRow,
  CInvalidFeedback,
  CSelect,
  CForm,
  CInputRadio,
  CFormGroup,
  CLabel,
} from '@coreui/react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-widgets/DatePicker';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { convertDateToUtc, dateToUnix } from 'utils/helper';
import 'react-widgets/styles.css';
import { getToken } from 'utils/authHelper';
import axiosInstance from 'utils/axiosInstance';
import eventBus from 'utils/eventBus';
import LoadingButton from 'components/LoadingButton';
import SuccessfulActionModalBody from 'components/SuccessfulActionModalBody';
import styles from './index.module.scss';

const TraceModal = ({ show, toggleModal }) => {
  const { t } = useTranslation();
  const [hadSuccess, setHadSuccess] = useState(false);
  const [hadFailure, setHadFailure] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [usingDuration, setUsingDuration] = useState(true);
  const [duration, setDuration] = useState(20);
  const [packets, setPackets] = useState(100);
  const [chosenDate, setChosenDate] = useState(new Date().toString());
  const [responseBody, setResponseBody] = useState('');
  const [chosenInterface, setChosenInterface] = useState('up');
  const selectedDeviceId = useSelector((state) => state.selectedDeviceId);

  const setDate = (date) => {
    if (date) {
      setChosenDate(date.toString());
    }
  };

  useEffect(() => {
    setHadSuccess(false);
    setHadFailure(false);
    setWaiting(false);
    setChosenDate(new Date().toString());
    setResponseBody('');
    setDuration(20);
    setPackets(100);
    setChosenInterface('up');
  }, [show]);

  const doAction = () => {
    setHadFailure(false);
    setHadSuccess(false);
    setWaiting(true);

    const token = getToken();
    const dateChosen = new Date(chosenDate);
    const now = new Date();
    let utcDateString = dateChosen.toISOString();

    if (dateChosen <= now) {
      const newDate = new Date();
      newDate.setSeconds(newDate.getSeconds() + 60);
      utcDateString = newDate.toISOString();
    }

    const parameters = {
      serialNumber: selectedDeviceId,
      when: dateChosen <= now ? 0 : dateToUnix(utcDateString),
      network: chosenInterface,
    };

    if (usingDuration) {
      parameters.duration = parseInt(duration, 10);
    } else {
      parameters.numberOfPackets = parseInt(packets, 10);
    }

    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    axiosInstance
      .post(`/device/${encodeURIComponent(selectedDeviceId)}/trace`, parameters, { headers })
      .then(() => {
        setHadSuccess(true);
      })
      .catch(() => {
        setResponseBody(t('commands.error'));
        setHadFailure(true);
      })
      .finally(() => {
        setWaiting(false);
        eventBus.dispatch('actionCompleted', { message: 'An action has been completed' });
      });
  };

  return (
    <CModal show={show} onClose={toggleModal}>
      <CModalHeader closeButton>
        <CModalTitle>{t('trace.title')}</CModalTitle>
      </CModalHeader>
      {hadSuccess ? (
        <SuccessfulActionModalBody toggleModal={toggleModal} />
      ) : (
        <div>
          <CModalBody>
            <h6>{t('trace.directions')}</h6>
            <CRow className={styles.spacedRow}>
              <CCol>
                <CButton
                  disabled={waiting}
                  block
                  color="primary"
                  onClick={() => setUsingDuration(true)}
                >
                  {t('common.duration')}
                </CButton>
              </CCol>
              <CCol>
                <CButton
                  disabled={waiting}
                  block
                  color="primary"
                  onClick={() => setUsingDuration(false)}
                >
                  {t('trace.packets')}
                </CButton>
              </CCol>
            </CRow>
            <CRow className={styles.spacedRow}>
              <CCol md="4" className={styles.spacedColumn}>
                {usingDuration ? 'Duration: ' : 'Packets: '}
              </CCol>
              <CCol xs="12" md="8">
                {usingDuration ? (
                  <CSelect defaultValue="duration" disabled={waiting}>
                    <option value="20" onClick={() => setDuration(20)}>
                      20s
                    </option>
                    <option value="40" onClick={() => setDuration(40)}>
                      40s
                    </option>
                    <option value="60" onClick={() => setDuration(60)}>
                      60s
                    </option>
                    <option value="120" onClick={() => setDuration(120)}>
                      120s
                    </option>
                  </CSelect>
                ) : (
                  <CSelect defaultValue={packets} disabled={waiting}>
                    <option value="100" onClick={() => setPackets(100)}>
                      100
                    </option>
                    <option value="250" onClick={() => setPackets(250)}>
                      250
                    </option>
                    <option value="500" onClick={() => setPackets(500)}>
                      500
                    </option>
                    <option value="1000" onClick={() => setPackets(1000)}>
                      1000
                    </option>
                  </CSelect>
                )}
              </CCol>
            </CRow>
            <CRow className={styles.spacedRow}>
              <CCol md="4" className={styles.spacedColumn}>
                <p>{t('common.date')}:</p>
              </CCol>
              <CCol xs="12" md="8">
                <DatePicker
                  selected={new Date(chosenDate)}
                  includeTime
                  value={new Date(chosenDate)}
                  placeholder="Select custom date"
                  disabled={waiting}
                  onChange={(date) => setDate(date)}
                  min={convertDateToUtc(new Date())}
                />
              </CCol>
            </CRow>
            <CInvalidFeedback>{t('common.need_date')}</CInvalidFeedback>
            <CRow className={styles.spacedRow}>
              <CCol md="7">{t('trace.choose_network')}:</CCol>
              <CCol>
                <CForm>
                  <CFormGroup variant="checkbox" onClick={() => setChosenInterface('up')}>
                    <CInputRadio
                      defaultChecked={chosenInterface === 'up'}
                      id="traceRadio1"
                      name="radios"
                      value="traceOption1"
                    />
                    <CLabel variant="checkbox" htmlFor="traceRadio1">
                      Up
                    </CLabel>
                  </CFormGroup>
                  <CFormGroup variant="checkbox" onClick={() => setChosenInterface('down')}>
                    <CInputRadio
                      defaultChecked={chosenInterface === 'down'}
                      id="traceRadio2"
                      name="radios"
                      value="traceOption2"
                    />
                    <CLabel variant="checkbox" htmlFor="traceRadio2">
                      Down
                    </CLabel>
                  </CFormGroup>
                </CForm>
              </CCol>
            </CRow>
            <div hidden={!hadSuccess && !hadFailure}>
              <div>
                <pre className="ignore">{responseBody} </pre>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <LoadingButton
              label="Schedule"
              isLoadingLabel="Loading..."
              isLoading={waiting}
              action={doAction}
              variant="outline"
              block={false}
              disabled={waiting}
            />
            <CButton color="secondary" onClick={toggleModal}>
              {t('common.cancel')}
            </CButton>
          </CModalFooter>
        </div>
      )}
    </CModal>
  );
};

TraceModal.propTypes = {
  show: PropTypes.bool.isRequired,
  toggleModal: PropTypes.func.isRequired,
};

export default TraceModal;