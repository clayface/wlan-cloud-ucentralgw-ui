import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { CAlert, CModalBody, CButton, CSpinner, CModalFooter } from '@coreui/react';
import { useAuth } from 'ucentral-libs';
import axiosInstance from 'utils/axiosInstance';

const WaitingForTraceBody = ({ serialNumber, commandUuid, toggle }) => {
  const { t } = useTranslation();
  const { currentToken, endpoints } = useAuth();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [waitingForFile, setWaitingForFile] = useState(true);
  const [error, setError] = useState(null);

  const getTraceResult = () => {
    const options = {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
    };

    axiosInstance
      .get(`${endpoints.owgw}/api/v1/command/${encodeURIComponent(commandUuid)}`, options)
      .then((response) => {
        if (response.data.waitingForFile === 0) {
          setWaitingForFile(false);
        }
        if (response.data.errorCode !== 0) {
          setWaitingForFile(false);
          setError(response.data.errorText);
        }
      })
      .catch(() => {});
  };

  const downloadTrace = () => {
    const options = {
      headers: {
        Accept: 'application/octet-stream',
        Authorization: `Bearer ${currentToken}`,
      },
      responseType: 'arraybuffer',
    };

    axiosInstance
      .get(`${endpoints.owgw}/api/v1/file/${commandUuid}?serialNumber=${serialNumber}`, options)
      .then((response) => {
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Trace_${commandUuid}.pcap`;
        link.click();
      });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(secondsElapsed + 1);
    }, 1000);
    if (!waitingForFile) {
      clearInterval(timer);
    }
    return () => {
      clearInterval(timer);
    };
  }, [waitingForFile, secondsElapsed]);

  useEffect(() => {
    const refreshStatus = setInterval(() => {
      getTraceResult();
    }, 5000);
    if (!waitingForFile) {
      clearInterval(refreshStatus);
    }
    return () => {
      clearInterval(refreshStatus);
    };
  }, [waitingForFile]);

  return (
    <div>
      <CModalBody>
        <h6>{t('trace.waiting_seconds', { seconds: secondsElapsed })}</h6>
        <p>{t('trace.waiting_directions')}</p>
        <div className="d-flex align-middle justify-content-center">
          <CSpinner hidden={!waitingForFile} />
          <CButton
            hidden={waitingForFile || error}
            onClick={downloadTrace}
            disabled={waitingForFile || error}
            color="primary"
          >
            {t('trace.download_trace')}
          </CButton>
          <CAlert hidden={waitingForFile || !error} className="my-3" color="danger">
            {t('trace.trace_not_successful', { error })}
          </CAlert>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" block onClick={toggle}>
          {t('common.exit')}
        </CButton>
      </CModalFooter>
    </div>
  );
};

WaitingForTraceBody.propTypes = {
  serialNumber: PropTypes.string.isRequired,
  commandUuid: PropTypes.string.isRequired,
  toggle: PropTypes.func.isRequired,
};

export default WaitingForTraceBody;
