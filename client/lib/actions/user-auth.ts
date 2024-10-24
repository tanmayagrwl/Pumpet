// authenticate.ts
"use server";

import axios from 'axios';

export const authenticate = async () => {
  try {
    const response = await axios.post('http://localhost:5050/api/v1/auth/jira/signup?r=1', {});
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return null; 
  }
};
