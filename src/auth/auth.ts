import { createEffect, createStore } from "effector";
import { useUnit } from "effector-react";
import { User } from "../api/a7-service/model";
import { getApiAuthProfile, postApiAuthLogin } from "../api/a7-service";
import { defaultApiAxiosParams } from "../api/helpers";

export const $currentProfile = createStore<{
  data?: User;
  error?: Error;
}>({});

export const getProfileFx = createEffect({
  handler: () => getApiAuthProfile(defaultApiAxiosParams)
});

$currentProfile
  .on(getProfileFx.doneData, (_, res) => ({
    data: res.data?.user,
  }))
  .on(getProfileFx.failData, (_, value) => ({
    error: value,
  }));

export const useProfile = () => {
  const { data, error } = useUnit($currentProfile);
  const isFetching = useUnit(getProfileFx.pending);

  return { data, isFetching, error };
};
