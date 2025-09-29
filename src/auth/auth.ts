import { createEffect, createStore } from "effector";
import { useUnit } from "effector-react";
import { defaultApiAxiosParams } from "../api/helpers";
import { getUsersInfo } from "../apiV2/a7-service";
import { UserInfoResponse } from "../apiV2/a7-service/model";


export const $currentProfile = createStore<{
  data?: UserInfoResponse;
  error?: Error;
}>({});

export const getProfileFx = createEffect({
  handler: () => getUsersInfo(defaultApiAxiosParams)
});

$currentProfile
  .on(getProfileFx.doneData, (_, res) => ({
    data: res.data,
  }))
  .on(getProfileFx.failData, (_, value) => ({
    error: value,
  }));

export const useProfile = () => {
  const { data, error } = useUnit($currentProfile);
  const isFetching = useUnit(getProfileFx.pending);

  return { data, isFetching, error };
};
