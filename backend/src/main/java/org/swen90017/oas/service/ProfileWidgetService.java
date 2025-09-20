package org.swen90017.oas.service;

import java.util.List;
import org.swen90017.oas.dto.profile.RoleWidgetItem;
import org.swen90017.oas.entity.SysUser;

public interface ProfileWidgetService {
    List<RoleWidgetItem> buildWidgets(SysUser user, String roleKey);
}
