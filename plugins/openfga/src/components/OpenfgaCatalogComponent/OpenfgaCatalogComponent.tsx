import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, FormLabel, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { sendPermissionRequest, addPolicy, revokePolicy } from '../../client'; 
import Alert from '@material-ui/lab/Alert';

import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { CATALOG_FILTER_EXISTS, catalogApiRef } from '@backstage/plugin-catalog-react';

const actionOptions = ['Read', 'Delete'];
const accessTypeOptions = ['owner', 'viewer'];

const useStyles = makeStyles({
  success: {
    color: 'green',
  },
  danger: {
    color: 'red',
  },
  info: {
    color: 'blue',
  },
});

export const OpenfgaCatalogComponent = () => {
  const classes = useStyles();
  const [entities, setEntities] = useState<string[]>([]);
  const [user, setUser] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>(actionOptions[0]);
  const [selectedAccessType, setSelectedAccessType] = useState<string>(accessTypeOptions[0]);
  const [allowMessage, setAllowMessage] = useState<string>('');
  const [denyMessage, setDenyMessage] = useState<string>('');
  const [policyMessage, setPolicyMessage] = useState<string>('');
  const catalogApi = useApi(catalogApiRef);
  const identityApi = useApi(identityApiRef);

  const handleEntityChange = (event: any) => {
    setSelectedEntity(event.target.value);
  };

  const handleActionChange = (event: any) => {
    setSelectedAction(event.target.value);
  };

  const handleAccessTypeChange = (event: any) => {
    setSelectedAccessType(event.target.value);
  };

  const fetchEntities = async () => {
    try {
      const { items } = await catalogApi.getEntities({ 
        fields: ['metadata.name'],
        // filter: {
        //   'kind=component': CATALOG_FILTER_EXISTS,
        // },
      });
      const entityNames = items.map((entity) => entity.metadata.name);
      const { ownershipEntityRefs } = await identityApi.getBackstageIdentity();
      setUser(ownershipEntityRefs);
      setEntities(entityNames);
      if (entityNames.length > 0) {
        setSelectedEntity(entityNames[0]);
      }
    } catch (error) {
      console.error('Error fetching catalog entities:', error);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleActivatePolicy = async () => {
    const response = await sendPermissionRequest(selectedEntity, selectedAction, user);
    if (response.allowed) {
      setAllowMessage(`${user} Has permission to ${selectedAction} the ${selectedEntity}`);
    } else {
      setDenyMessage(selectedAction === 'Read' ? 
      `${user} have permission only to ${selectedAction} the ${selectedEntity}` :
      `${user} Don't have permission to ${selectedAction} the ${selectedEntity}`);
    }
    setTimeout(() => {
      setAllowMessage('');
      setDenyMessage('');
    }, 5000);
  };

  const handleAddPolicy = async () => {
    const response = await addPolicy(selectedEntity, selectedAccessType, user);
    if (Object.keys(response).length === 0 && response.constructor === Object){
      setPolicyMessage(selectedAccessType === 'owner' ? 
        'Added permission for user to read/delete the entity' :
        'Added permission for user to read not delete the entity');
    } else {
      setPolicyMessage(response.message);
    }
    setTimeout(() => {
      setPolicyMessage('');
    }, 5000);
  };

  const handleRevokePolicy = async () => {
    const response = await revokePolicy(selectedEntity, selectedAccessType, user);
    if (Object.keys(response).length === 0 && response.constructor === Object){
      setPolicyMessage(selectedAccessType === 'owner' ? 
        'Revoked permission for user to read/delete the entity' :
        'Revoked permission for user to read not delete the entity');
    } else {
      setPolicyMessage(response.message);
    }
    setTimeout(() => {
      setPolicyMessage('');
    }, 5000);
  };

  return (
    <Box sx={{ border: 1, borderRadius: 0, p: 2, bgcolor: 'cyan', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Box sx={{ width: '45%' }}>
        <Typography className={classes.info} variant="body2" gutterBottom>
          {user}
        </Typography>
        <Typography variant="h6" gutterBottom>
          START EXISTING POLICY
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <FormControl>
            <FormLabel>Select Entity</FormLabel>
            <Select
              value={selectedEntity}
              onChange={handleEntityChange}
              label="Select Entity"
            >
              {entities.map((entityName: string) => (
                <MenuItem key={entityName} value={entityName}>
                  {entityName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Select Action</FormLabel>
            <Select
              value={selectedAction}
              onChange={handleActionChange}
              label="Select Action"
            >
              {actionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            className={classes.success}
            variant="contained"
            onClick={handleActivatePolicy}
          >
            Start Policy
          </Button>
        </Box>
        {allowMessage && (
          <Alert severity="success">{allowMessage}</Alert>
        )}
        {denyMessage && (
          <Alert severity="success">{denyMessage}</Alert>
        )}
      </Box>

      <Box sx={{ width: '45%' }}>
        <Typography className={classes.info} variant="body2" gutterBottom>
          {user}
        </Typography>
        <Typography variant="h6" gutterBottom>
          MODIFY/ADD POLICY
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <FormControl>
            <FormLabel>Select Entity</FormLabel>
            <Select
              value={selectedEntity}
              onChange={handleEntityChange}
              label="Select Entity"
            >
              {entities.map((entityName: string) => (
                <MenuItem key={entityName} value={entityName}>
                  {entityName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Select Access Type</FormLabel>
            <Select
              value={selectedAccessType}
              onChange={handleAccessTypeChange}
              label="Select Access Type"
            >
              {accessTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            className={classes.success}
            variant="contained"
            onClick={handleAddPolicy}
          >
            Add Policy
          </Button>
          <Button
            className={classes.danger}
            variant="contained"
            onClick={handleRevokePolicy}
          >
            Revoke Policy
          </Button>
        </Box>
        {policyMessage && (
          <Alert severity={policyMessage.includes('Added') ? 'success' : 'error'}>{policyMessage}</Alert>
        )}
      </Box>
    </Box>
  );
};
