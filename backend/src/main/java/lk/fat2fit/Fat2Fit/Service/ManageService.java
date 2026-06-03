package lk.fat2fit.Fat2Fit.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import lk.fat2fit.Fat2Fit.DTO.Manage.AssignFitnessGoalRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMembershipRenewRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMembershipSuspendRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.FitnessGoalResponse;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMetricsRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.ClientMetricsResponse;
import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.HealthScreeningResponse;
import lk.fat2fit.Fat2Fit.DTO.Manage.UpdateMyFitnessGoalRequest;
import lk.fat2fit.Fat2Fit.DTO.Manage.UserDetailResponse;
import lk.fat2fit.Fat2Fit.DTO.Manage.UserEditRequest;
import lk.fat2fit.Fat2Fit.Entity.Client;
import lk.fat2fit.Fat2Fit.Entity.ClientFitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.ClientHealthScreening;
import lk.fat2fit.Fat2Fit.Entity.ClientMeasurement;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoal;
import lk.fat2fit.Fat2Fit.Entity.Enum.FitnessGoalStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.MembershipPlanStatus;
import lk.fat2fit.Fat2Fit.Entity.Enum.Role;
import lk.fat2fit.Fat2Fit.Entity.Instructor;
import lk.fat2fit.Fat2Fit.Entity.MembershipPlan;
import lk.fat2fit.Fat2Fit.Entity.User;
import lk.fat2fit.Fat2Fit.Repository.ClientFitnessGoalRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientHealthScreeningRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientMeasurementRepository;
import lk.fat2fit.Fat2Fit.Repository.ClientRepository;
import lk.fat2fit.Fat2Fit.Repository.MembershipPlanRepository;
import lk.fat2fit.Fat2Fit.Repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ManageService {

    private static final Set<Set<FitnessGoal>> CONFLICTING_GOAL_PAIRS = Set.of(
            Set.of(FitnessGoal.FAT_BURNING, FitnessGoal.MUSCLE_GAIN),
            Set.of(FitnessGoal.SLIM_FIT_TRAINING, FitnessGoal.MUSCLE_GAIN),
            Set.of(FitnessGoal.CARDIO_TRAINING, FitnessGoal.MUSCLE_STRENGTHENING)
    );

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ClientFitnessGoalRepository clientFitnessGoalRepository;
    private final ClientHealthScreeningRepository healthScreeningRepository;
    private final ClientMeasurementRepository measurementRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private UserDetailResponse toDetailResponse(User u) {
        UserDetailResponse.UserDetailResponseBuilder builder = UserDetailResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .age(u.getAge())
                .dateOfBirth(u.getDateOfBirth())
                .gender(u.getGender())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .landPhone(u.getLandPhone())
                .emergencyContactName(u.getEmergencyContactName())
                .emergencyContactRelationship(u.getEmergencyContactRelationship())
                .emergencyContactNumber(u.getEmergencyContactNumber())
                .bloodGroup(u.getBloodGroup())
                .address(u.getAddress())
                .role(u.getRole())
                .isActive(u.getIsActive())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .profilePicture(u.getProfilePicture());

        // Populate instructor-specific fields when applicable
        if (u instanceof Instructor ins) {
            builder.instructorStatus(ins.getStatus());
            if (ins.getEmployment() != null) {
                builder.employmentType(ins.getEmployment().getEmploymentType())
                        .workingHoursPerWeek(ins.getEmployment().getWorkingHoursPerWeek())
                        .salary(ins.getEmployment().getSalary());
            }
        }

        if (u instanceof Client client) {
            LocalDate membershipStartDate = client.getMembershipStartDate();
            LocalDate membershipEndDate = client.getMembershipEndDate();

            if (client.getMembershipPlan() != null && (membershipStartDate == null || membershipEndDate == null)) {
                MembershipPeriod derivedPeriod = deriveMembershipPeriod(client);
                membershipStartDate = derivedPeriod.startDate();
                membershipEndDate = derivedPeriod.endDate();
            }

            builder.membershipPlanId(client.getMembershipPlan() != null ? client.getMembershipPlan().getId() : null)
                   .membershipPlanName(client.getMembershipPlan() != null ? client.getMembershipPlan().getPlanName() : null)
                   .membershipStatus(resolveMembershipStatus(client.getMembershipPlan(), membershipStartDate, membershipEndDate))
                   .membershipStartDate(membershipStartDate)
                     .membershipEndDate(membershipEndDate)
                     .highRiskMember(Boolean.TRUE.equals(client.getHighRiskMember()));
        }

        return builder.build();
    }

    private void applyEdits(User user, UserEditRequest req, boolean allowIsActive) {
        if (req.getFirstName() != null && !req.getFirstName().isBlank())
            user.setFirstName(req.getFirstName().trim());
        if (req.getLastName() != null && !req.getLastName().isBlank())
            user.setLastName(req.getLastName().trim());
        if (req.getAge() != null && req.getAge() > 0)
            user.setAge(req.getAge());
        if (req.getDateOfBirth() != null)
            user.setDateOfBirth(req.getDateOfBirth());
        if (req.getGender() != null)
            user.setGender(req.getGender());
        if (req.getEmail() != null && !req.getEmail().isBlank())
            user.setEmail(req.getEmail().trim());
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank())
            user.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getAddress() != null && !req.getAddress().isBlank())
            user.setAddress(req.getAddress().trim());
        // Optional fields — allow explicit null/blank to clear them
        user.setLandPhone(emptyToNull(req.getLandPhone()));
        user.setEmergencyContactName(emptyToNull(req.getEmergencyContactName()));
        user.setEmergencyContactRelationship(emptyToNull(req.getEmergencyContactRelationship()));
        user.setEmergencyContactNumber(emptyToNull(req.getEmergencyContactNumber()));
        user.setBloodGroup(emptyToNull(req.getBloodGroup()));
        if (allowIsActive && req.getIsActive() != null)
            user.setIsActive(req.getIsActive());
    }

    private String emptyToNull(String v) {
        return (v == null || v.trim().isEmpty()) ? null : v.trim();
    }

    private Optional<Client> findClientById(Long clientId) {
        if (clientId == null) {
            return Optional.empty();
        }
        if (clientId > Integer.MAX_VALUE || clientId < Integer.MIN_VALUE) {
            return Optional.empty();
        }
        return clientRepository.findById(clientId.intValue());
    }

    // ── Admin: get all users except self ──────────────────────────────────────

    public ResponseEntity<?> getAllUsersExceptSelf() {
        int selfId = getCurrentUser().getId();
        List<UserDetailResponse> list = userRepository.findAll()
                .stream()
                .filter(u -> u.getId() != selfId)
                .map(this::toDetailResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    // ── Admin / Instructor: get all clients ───────────────────────────────────

    public ResponseEntity<?> getAllClients() {
        List<UserDetailResponse> list = clientRepository.findAll()
                .stream()
                .map(this::toDetailResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    // ── Admin: edit any user's details (role excluded) ────────────────────────

    public ResponseEntity<?> editUser(int targetId, UserEditRequest req) {
        int selfId = getCurrentUser().getId();
        if (targetId == selfId) {
            return ResponseEntity.badRequest().body("Use /api/manage/me to edit your own account.");
        }

        Optional<User> userOpt = userRepository.findById(targetId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        User user = userOpt.get();

        // Validate email uniqueness if changing
        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use.");
        }
        // Validate phone uniqueness if changing
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().equals(user.getPhoneNumber())
                && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone number already in use.");
        }

        applyEdits(user, req, true);
        userRepository.save(user);
        return ResponseEntity.ok(toDetailResponse(user));
    }

    // ── Admin / Instructor: edit a client's details ────────────────────────────

    public ResponseEntity<?> editClient(Long clientId, UserEditRequest req) {
        Optional<Client> clientOpt = findClientById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        Client client = clientOpt.get();

        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(client.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use.");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().equals(client.getPhoneNumber())
                && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone number already in use.");
        }

        if (req.getMembershipPlanId() != null) {
            if (req.getMembershipPlanId() <= 0) {
                client.setMembershipPlan(null);
                client.setMembershipStartDate(null);
                client.setMembershipEndDate(null);
            } else {
                Optional<MembershipPlan> planOpt = membershipPlanRepository.findById(req.getMembershipPlanId());
                if (planOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Membership plan not found.");
                }

                MembershipPlan selectedPlan = planOpt.get();
                if (selectedPlan.getStatus() != MembershipPlanStatus.ACTIVE) {
                    return ResponseEntity.badRequest().body("Only active membership plans can be assigned.");
                }

                client.setMembershipPlan(selectedPlan);
                LocalDate startDate = req.getMembershipStartDate() != null
                        ? req.getMembershipStartDate()
                        : LocalDate.now();
                client.setMembershipStartDate(startDate);
                client.setMembershipEndDate(startDate.plusDays(selectedPlan.getDurationDays().longValue()));
            }
        } else if (req.getMembershipStartDate() != null && client.getMembershipPlan() != null) {
            LocalDate startDate = req.getMembershipStartDate();
            client.setMembershipStartDate(startDate);
            client.setMembershipEndDate(startDate.plusDays(client.getMembershipPlan().getDurationDays().longValue()));
        }

        applyEdits(client, req, true);
        clientRepository.save(client);
        return ResponseEntity.ok(toDetailResponse(client));
    }

    // ── Admin / Instructor: get client body metrics ───────────────────────────

    public ResponseEntity<?> getClientMetrics(Long clientId) {
        if (findClientById(clientId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        return measurementRepository.findTopByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc(clientId)
                .<ResponseEntity<?>>map(measurement -> ResponseEntity.ok(toMetricsResponse(clientId, measurement)))
                .orElseGet(() -> ResponseEntity.ok(ClientMetricsResponse.builder().clientId(clientId).build()));
    }

    public ResponseEntity<?> getClientMetricsHistory(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        List<ClientMetricsResponse> history = measurementRepository
                .findByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc(clientId)
                .stream()
                .map(measurement -> toMetricsResponse(clientId, measurement))
                .toList();

        return ResponseEntity.ok(history);
    }

    public ResponseEntity<?> getMyMetricsHistory() {
        User self = getCurrentUser();
        if (!(self instanceof Client client)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only clients can view their own measurement history.");
        }

        List<ClientMetricsResponse> history = measurementRepository
                .findByClientIdOrderByMeasurementDateDescRecordedAtDescIdDesc((long) client.getId())
                .stream()
                .map(measurement -> toMetricsResponse((long) client.getId(), measurement))
                .toList();

        return ResponseEntity.ok(history);
    }

    // ── Admin / Instructor: save client body metrics ──────────────────────────

    public ResponseEntity<?> saveClientMetrics(Long clientId, ClientMetricsRequest req) {
        Optional<Client> clientOpt = findClientById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        String validationError = validateMeasurementRequest(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        ClientMeasurement measurement = ClientMeasurement.builder()
                .client(clientOpt.get())
                .heightCm(req.getHeightCm())
                .weightKg(req.getWeightKg())
                .waistCm(req.getWaistCm())
                .hipCm(req.getHipCm())
                .armCm(req.getArmCm())
                .shoulderCm(req.getShoulderCm())
                .breastCm(req.getBreastCm())
                .buttocksCm(req.getButtocksCm())
                .measurementDate(req.getMeasurementDate())
                .bmi(calculateBmi(req.getHeightCm(), req.getWeightKg()))
                .build();

        ClientMeasurement saved = measurementRepository.save(measurement);
        return ResponseEntity.ok(toMetricsResponse(clientId, saved));
    }

    private String validateMeasurementRequest(ClientMetricsRequest req) {
        if (req == null
                || req.getHeightCm() == null
                || req.getWeightKg() == null
                || req.getWaistCm() == null
                || req.getHipCm() == null
                || req.getArmCm() == null
                || req.getShoulderCm() == null
                || req.getBreastCm() == null
                || req.getButtocksCm() == null
                || req.getMeasurementDate() == null) {
            return "All measurement fields are required.";
        }

        if (isNonPositive(req.getHeightCm())
                || isNonPositive(req.getWeightKg())
                || isNonPositive(req.getWaistCm())
                || isNonPositive(req.getHipCm())
                || isNonPositive(req.getArmCm())
                || isNonPositive(req.getShoulderCm())
                || isNonPositive(req.getBreastCm())
                || isNonPositive(req.getButtocksCm())) {
            return "Measurement values must be positive numbers.";
        }

        return null;
    }

    private boolean isNonPositive(BigDecimal value) {
        return value.compareTo(BigDecimal.ZERO) <= 0;
    }

    private BigDecimal calculateBmi(BigDecimal heightCm, BigDecimal weightKg) {
        BigDecimal heightM = heightCm.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        BigDecimal heightSquared = heightM.multiply(heightM);
        return weightKg.divide(heightSquared, 2, RoundingMode.HALF_UP);
    }

    private ClientMetricsResponse toMetricsResponse(Long clientId, ClientMeasurement m) {
        return ClientMetricsResponse.builder()
                .measurementId(m.getId())
                .clientId(clientId)
                .heightCm(m.getHeightCm())
                .weightKg(m.getWeightKg())
                .waistCm(m.getWaistCm())
                .hipCm(m.getHipCm())
                .armCm(m.getArmCm())
                .shoulderCm(m.getShoulderCm())
                .breastCm(m.getBreastCm())
                .buttocksCm(m.getButtocksCm())
                .measurementDate(m.getMeasurementDate())
                .bmi(m.getBmi())
                .recordedAt(m.getRecordedAt())
                .build();
    }

    // ── Admin / Instructor: save health screening questionnaire ──────────────

    public ResponseEntity<?> saveClientHealthScreening(Long clientId, HealthScreeningRequest req) {
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        String validationError = validateHealthScreeningRequest(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        Client client = clientOpt.get();
        boolean highRisk = hasAnyHealthRiskIndicator(req);

        ClientHealthScreening screening = ClientHealthScreening.builder()
                .client(client)
                .cardiacConditions(Boolean.TRUE.equals(req.getCardiacConditions()))
                .respiratoryIssues(Boolean.TRUE.equals(req.getRespiratoryIssues()))
                .faintingOrBalanceProblems(Boolean.TRUE.equals(req.getFaintingOrBalanceProblems()))
                .jointOrMuscleDisorders(Boolean.TRUE.equals(req.getJointOrMuscleDisorders()))
                .highBloodPressure(Boolean.TRUE.equals(req.getHighBloodPressure()))
                .cholesterolLevels(Boolean.TRUE.equals(req.getCholesterolLevels()))
                .currentMedications(Boolean.TRUE.equals(req.getCurrentMedications()))
                .disabilitiesOrPhysicalLimitations(Boolean.TRUE.equals(req.getDisabilitiesOrPhysicalLimitations()))
                .additionalNotes(emptyToNull(req.getAdditionalNotes()))
                .highRisk(highRisk)
                .build();

        ClientHealthScreening saved = healthScreeningRepository.save(screening);

        client.setHighRiskMember(highRisk);
        clientRepository.save(client);

        return ResponseEntity.ok(toHealthScreeningResponse(saved, Boolean.TRUE.equals(client.getHighRiskMember())));
    }

    public ResponseEntity<?> getLatestClientHealthScreening(Long clientId) {
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        Optional<ClientHealthScreening> latestOpt = healthScreeningRepository
                .findTopByClientIdOrderByRecordedAtDescIdDesc(clientId);

        if (latestOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No health screening records found for this client.");
        }

        boolean memberHighRisk = Boolean.TRUE.equals(clientOpt.get().getHighRiskMember());
        return ResponseEntity.ok(toHealthScreeningResponse(latestOpt.get(), memberHighRisk));
    }

    private String validateHealthScreeningRequest(HealthScreeningRequest req) {
        if (req == null
                || req.getCardiacConditions() == null
                || req.getRespiratoryIssues() == null
                || req.getFaintingOrBalanceProblems() == null
                || req.getJointOrMuscleDisorders() == null
                || req.getHighBloodPressure() == null
                || req.getCholesterolLevels() == null
                || req.getCurrentMedications() == null
                || req.getDisabilitiesOrPhysicalLimitations() == null) {
            return "All required questionnaire responses must be provided.";
        }
        return null;
    }

    private boolean hasAnyHealthRiskIndicator(HealthScreeningRequest req) {
        return Boolean.TRUE.equals(req.getCardiacConditions())
                || Boolean.TRUE.equals(req.getRespiratoryIssues())
                || Boolean.TRUE.equals(req.getFaintingOrBalanceProblems())
                || Boolean.TRUE.equals(req.getJointOrMuscleDisorders())
                || Boolean.TRUE.equals(req.getHighBloodPressure())
                || Boolean.TRUE.equals(req.getCholesterolLevels())
                || Boolean.TRUE.equals(req.getCurrentMedications())
                || Boolean.TRUE.equals(req.getDisabilitiesOrPhysicalLimitations());
    }

    private HealthScreeningResponse toHealthScreeningResponse(ClientHealthScreening screening, boolean memberHighRisk) {
        return HealthScreeningResponse.builder()
                .screeningId(screening.getId())
                .clientId((long) screening.getClient().getId())
                .cardiacConditions(screening.isCardiacConditions())
                .respiratoryIssues(screening.isRespiratoryIssues())
                .faintingOrBalanceProblems(screening.isFaintingOrBalanceProblems())
                .jointOrMuscleDisorders(screening.isJointOrMuscleDisorders())
                .highBloodPressure(screening.isHighBloodPressure())
                .cholesterolLevels(screening.isCholesterolLevels())
                .currentMedications(screening.isCurrentMedications())
                .disabilitiesOrPhysicalLimitations(screening.isDisabilitiesOrPhysicalLimitations())
                .additionalNotes(screening.getAdditionalNotes())
                .highRisk(screening.isHighRisk())
                .memberHighRisk(memberHighRisk)
                .recordedAt(screening.getRecordedAt())
                .build();
    }

    // ── Fitness goals: instructor assignment + member management ─────────────

    public ResponseEntity<?> getClientFitnessGoals(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        List<FitnessGoalResponse> goals = clientFitnessGoalRepository
                .findByClientIdOrderByAssignedAtDescIdDesc(clientId)
                .stream()
                .map(this::toFitnessGoalResponse)
                .toList();

        return ResponseEntity.ok(goals);
    }

    public ResponseEntity<?> assignClientFitnessGoal(Long clientId, AssignFitnessGoalRequest req) {
        User self = getCurrentUser();
        if (self.getRole() != Role.INSTRUCTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only instructors can assign fitness goals.");
        }

        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        String validationError = validateGoalAssignmentRequest(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        FitnessGoalStatus status = req.getStatus() != null ? req.getStatus() : FitnessGoalStatus.ACTIVE;
        if (status == FitnessGoalStatus.ACTIVE) {
            Optional<ClientFitnessGoal> conflicting = findConflictingActiveGoal(clientId, null, req.getGoal());
            if (conflicting.isPresent()) {
                String message = String.format(
                        "Goal %s conflicts with already active goal %s.",
                        req.getGoal(),
                        conflicting.get().getGoal());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
            }
        }

        ClientFitnessGoal assignment = ClientFitnessGoal.builder()
                .client(clientOpt.get())
                .goal(req.getGoal())
                .otherGoalSpecification(normalizeOtherGoal(req.getGoal(), req.getOtherGoalSpecification()))
                .instructorRequirements(req.getInstructorRequirements().trim())
                .allowTargetWeightUpdate(Boolean.TRUE.equals(req.getAllowTargetWeightUpdate()))
                .allowTargetParametersUpdate(Boolean.TRUE.equals(req.getAllowTargetParametersUpdate()))
                .allowTargetDateUpdate(Boolean.TRUE.equals(req.getAllowTargetDateUpdate()))
                .targetWeightKg(req.getTargetWeightKg())
                .targetParameters(normalizeText(req.getTargetParameters()))
                .targetCompletionDate(req.getTargetCompletionDate())
                .progressPercent(req.getProgressPercent())
                .progressNotes(normalizeText(req.getProgressNotes()))
                .status(status)
                .assignedBy(self)
                .approvedByInstructor(true)
                .build();

        ClientFitnessGoal saved = clientFitnessGoalRepository.save(assignment);
        return ResponseEntity.ok(toFitnessGoalResponse(saved));
    }

    public ResponseEntity<?> updateClientFitnessGoal(Long clientId, Long goalId, AssignFitnessGoalRequest req) {
        User self = getCurrentUser();
        if (self.getRole() != Role.INSTRUCTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only instructors can edit assigned fitness goals.");
        }

        Optional<ClientFitnessGoal> goalOpt = clientFitnessGoalRepository.findByIdAndClientId(goalId, clientId);
        if (goalOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Assigned fitness goal not found.");
        }

        String validationError = validateGoalAssignmentRequest(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        FitnessGoalStatus targetStatus = req.getStatus() != null ? req.getStatus() : FitnessGoalStatus.ACTIVE;
        if (targetStatus == FitnessGoalStatus.ACTIVE) {
            Optional<ClientFitnessGoal> conflicting = findConflictingActiveGoal(clientId, goalId, req.getGoal());
            if (conflicting.isPresent()) {
                String message = String.format(
                        "Goal %s conflicts with already active goal %s.",
                        req.getGoal(),
                        conflicting.get().getGoal());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
            }
        }

        ClientFitnessGoal existing = goalOpt.get();
        existing.setGoal(req.getGoal());
        existing.setOtherGoalSpecification(normalizeOtherGoal(req.getGoal(), req.getOtherGoalSpecification()));
        existing.setInstructorRequirements(req.getInstructorRequirements().trim());
        existing.setAllowTargetWeightUpdate(Boolean.TRUE.equals(req.getAllowTargetWeightUpdate()));
        existing.setAllowTargetParametersUpdate(Boolean.TRUE.equals(req.getAllowTargetParametersUpdate()));
        existing.setAllowTargetDateUpdate(Boolean.TRUE.equals(req.getAllowTargetDateUpdate()));
        existing.setTargetWeightKg(req.getTargetWeightKg());
        existing.setTargetParameters(normalizeText(req.getTargetParameters()));
        existing.setTargetCompletionDate(req.getTargetCompletionDate());
        existing.setProgressPercent(req.getProgressPercent());
        existing.setProgressNotes(normalizeText(req.getProgressNotes()));
        existing.setStatus(targetStatus);
        existing.setApprovedByInstructor(true);

        ClientFitnessGoal saved = clientFitnessGoalRepository.save(existing);
        return ResponseEntity.ok(toFitnessGoalResponse(saved));
    }

    public ResponseEntity<?> getMyFitnessGoals() {
        User self = getCurrentUser();
        if (!(self instanceof Client client)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only clients can view their own fitness goals.");
        }

        List<FitnessGoalResponse> goals = clientFitnessGoalRepository
                .findByClientIdOrderByAssignedAtDescIdDesc((long) client.getId())
                .stream()
                .map(this::toFitnessGoalResponse)
                .toList();

        return ResponseEntity.ok(goals);
    }

    public ResponseEntity<?> updateMyFitnessGoal(Long goalId, UpdateMyFitnessGoalRequest req) {
        User self = getCurrentUser();
        if (!(self instanceof Client client)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only clients can update their own fitness goals.");
        }

        Optional<ClientFitnessGoal> goalOpt = clientFitnessGoalRepository.findByIdAndClientId(goalId, (long) client.getId());
        if (goalOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Assigned fitness goal not found.");
        }

        if (req == null) {
            return ResponseEntity.badRequest().body("Update payload is required.");
        }

        ClientFitnessGoal goal = goalOpt.get();
        if (!Boolean.TRUE.equals(goal.getApprovedByInstructor())) {
            return ResponseEntity.badRequest().body("This goal is not approved by your instructor.");
        }

        String validationError = validateMyGoalUpdateRequest(goal, req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        FitnessGoalStatus targetStatus = req.getStatus() != null ? req.getStatus() : goal.getStatus();
        if (targetStatus == FitnessGoalStatus.ACTIVE) {
            if (goal.getAssignedBy() == null || goal.getAssignedBy().getRole() != Role.INSTRUCTOR) {
                return ResponseEntity.badRequest().body("Goal activation is allowed only for instructor-assigned goals.");
            }

            Optional<ClientFitnessGoal> conflicting = findConflictingActiveGoal((long) client.getId(), goal.getId(), goal.getGoal());
            if (conflicting.isPresent()) {
                String message = String.format(
                        "Cannot activate goal %s because it conflicts with active goal %s.",
                        goal.getGoal(),
                        conflicting.get().getGoal());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
            }
        }

        if (req.getStatus() != null) {
            goal.setStatus(req.getStatus());
        }
        if (req.getTargetWeightKg() != null) {
            goal.setTargetWeightKg(req.getTargetWeightKg());
        }
        if (req.getTargetParameters() != null) {
            goal.setTargetParameters(req.getTargetParameters().trim());
        }
        if (req.getTargetCompletionDate() != null) {
            goal.setTargetCompletionDate(req.getTargetCompletionDate());
        }
        if (req.getProgressPercent() != null) {
            goal.setProgressPercent(req.getProgressPercent());
        }
        if (req.getProgressNotes() != null) {
            goal.setProgressNotes(normalizeText(req.getProgressNotes()));
        }

        ClientFitnessGoal saved = clientFitnessGoalRepository.save(goal);
        return ResponseEntity.ok(toFitnessGoalResponse(saved));
    }

    private String validateGoalAssignmentRequest(AssignFitnessGoalRequest req) {
        if (req == null) {
            return "Goal assignment details are required.";
        }
        if (req.getGoal() == null) {
            return "Fitness goal is required.";
        }
        if (req.getInstructorRequirements() == null || req.getInstructorRequirements().trim().isEmpty()) {
            return "Instructor guidance is required.";
        }
        if (req.getInstructorRequirements().trim().length() > 1000) {
            return "Instructor guidance cannot exceed 1000 characters.";
        }

        if (req.getGoal() == FitnessGoal.OTHERS
                && (req.getOtherGoalSpecification() == null || req.getOtherGoalSpecification().trim().isEmpty())) {
            return "Please provide a specification for OTHERS fitness goal.";
        }

        if (req.getGoal() != FitnessGoal.OTHERS
                && req.getOtherGoalSpecification() != null
                && !req.getOtherGoalSpecification().trim().isEmpty()) {
            return "Other goal specification is only allowed for OTHERS goal.";
        }

        String targetValidationError = validateTargetFields(
                req.getTargetWeightKg(),
                req.getTargetParameters(),
                req.getTargetCompletionDate());
        if (targetValidationError != null) {
            return targetValidationError;
        }

        if (req.getProgressPercent() != null && (req.getProgressPercent() < 0 || req.getProgressPercent() > 100)) {
            return "Progress percent must be between 0 and 100.";
        }

        if (req.getProgressNotes() != null && req.getProgressNotes().length() > 1000) {
            return "Progress notes cannot exceed 1000 characters.";
        }

        return null;
    }

    private String validateMyGoalUpdateRequest(ClientFitnessGoal goal, UpdateMyFitnessGoalRequest req) {
        if (req.getTargetWeightKg() != null && !Boolean.TRUE.equals(goal.getAllowTargetWeightUpdate())) {
            return "Target weight can only be updated when instructed by your instructor.";
        }
        if (req.getTargetParameters() != null && !Boolean.TRUE.equals(goal.getAllowTargetParametersUpdate())) {
            return "Target parameters can only be updated when instructed by your instructor.";
        }
        if (req.getTargetCompletionDate() != null && !Boolean.TRUE.equals(goal.getAllowTargetDateUpdate())) {
            return "Target completion date can only be updated when instructed by your instructor.";
        }

        String targetValidationError = validateTargetFields(
                req.getTargetWeightKg(),
                req.getTargetParameters(),
                req.getTargetCompletionDate());
        if (targetValidationError != null) {
            return targetValidationError;
        }

        if (req.getProgressPercent() != null && (req.getProgressPercent() < 0 || req.getProgressPercent() > 100)) {
            return "Progress percent must be between 0 and 100.";
        }

        if (req.getProgressNotes() != null && req.getProgressNotes().length() > 1000) {
            return "Progress notes cannot exceed 1000 characters.";
        }

        if (req.getTargetParameters() != null && req.getTargetParameters().trim().isEmpty()) {
            return "Target parameters cannot be empty.";
        }

        return null;
    }

    private String validateTargetFields(BigDecimal targetWeightKg, String targetParameters, LocalDate targetCompletionDate) {
        if (targetWeightKg != null) {
            if (targetWeightKg.compareTo(BigDecimal.ZERO) <= 0 || targetWeightKg.compareTo(BigDecimal.valueOf(500)) > 0) {
                return "Target weight must be greater than 0 and less than or equal to 500 kg.";
            }
        }

        if (targetParameters != null && targetParameters.length() > 1000) {
            return "Target parameters cannot exceed 1000 characters.";
        }

        if (targetCompletionDate != null && targetCompletionDate.isBefore(LocalDate.now())) {
            return "Target completion date cannot be in the past.";
        }

        return null;
    }

    private Optional<ClientFitnessGoal> findConflictingActiveGoal(Long clientId, Long currentGoalId, FitnessGoal candidate) {
        return clientFitnessGoalRepository.findByClientIdAndStatus(clientId, FitnessGoalStatus.ACTIVE)
                .stream()
                .filter(goal -> currentGoalId == null || !goal.getId().equals(currentGoalId))
                .filter(goal -> areGoalsConflicting(candidate, goal.getGoal()))
                .findFirst();
    }

    private boolean areGoalsConflicting(FitnessGoal first, FitnessGoal second) {
        if (first == null || second == null) {
            return false;
        }
        if (first == second) {
            return true;
        }
        return CONFLICTING_GOAL_PAIRS.contains(EnumSet.of(first, second));
    }

    private String normalizeOtherGoal(FitnessGoal goal, String otherGoalSpecification) {
        if (goal != FitnessGoal.OTHERS) {
            return null;
        }
        return normalizeText(otherGoalSpecification);
    }

    private String normalizeText(String value) {
        return value == null ? null : emptyToNull(value);
    }

    private FitnessGoalResponse toFitnessGoalResponse(ClientFitnessGoal goal) {
        return FitnessGoalResponse.builder()
                .id(goal.getId())
                .clientId((long) goal.getClient().getId())
                .goal(goal.getGoal())
                .otherGoalSpecification(goal.getOtherGoalSpecification())
                .instructorRequirements(goal.getInstructorRequirements())
                .allowTargetWeightUpdate(Boolean.TRUE.equals(goal.getAllowTargetWeightUpdate()))
                .allowTargetParametersUpdate(Boolean.TRUE.equals(goal.getAllowTargetParametersUpdate()))
                .allowTargetDateUpdate(Boolean.TRUE.equals(goal.getAllowTargetDateUpdate()))
                .targetWeightKg(goal.getTargetWeightKg())
                .targetParameters(goal.getTargetParameters())
                .targetCompletionDate(goal.getTargetCompletionDate())
                .progressPercent(goal.getProgressPercent())
                .progressNotes(goal.getProgressNotes())
                .status(goal.getStatus())
                .approvedByInstructor(goal.getApprovedByInstructor())
                .assignedByUserId(goal.getAssignedBy() != null ? goal.getAssignedBy().getId() : null)
                .assignedByRole(goal.getAssignedBy() != null && goal.getAssignedBy().getRole() != null
                        ? goal.getAssignedBy().getRole().name()
                        : null)
                .assignedAt(goal.getAssignedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }

    // ── Client: edit own personal details ─────────────────────────────────────

    public ResponseEntity<?> editSelf(UserEditRequest req) {
        User self = getCurrentUser();

        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(self.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already in use.");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().equals(self.getPhoneNumber())
                && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone number already in use.");
        }

        applyEdits(self, req, false); // client cannot toggle isActive on themselves
        userRepository.save(self);
        return ResponseEntity.ok(toDetailResponse(self));
    }

    // ── Get own details (used by all roles on /manage) ───────────────────────

    public ResponseEntity<?> getSelf() {
        return ResponseEntity.ok(toDetailResponse(getCurrentUser()));
    }

    // ── Admin / Instructor: suspend/unsuspend a client's membership ──────────

    public ResponseEntity<?> updateClientMembershipSuspension(Long clientId, ClientMembershipSuspendRequest req) {
        Optional<Client> clientOpt = findClientById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        if (req == null) {
            return ResponseEntity.badRequest().body("Request payload is required.");
        }

        Client client = clientOpt.get();
        if (req.getSuspended() == null) {
            return ResponseEntity.badRequest().body("Suspended flag is required.");
        }

        client.setMembershipSuspended(req.getSuspended());
        clientRepository.save(client);
        return ResponseEntity.ok(toDetailResponse(client));
    }

    // ── Admin / Instructor: renew a client's membership from a start date ────

    public ResponseEntity<?> renewClientMembership(Long clientId, ClientMembershipRenewRequest req) {
        Optional<Client> clientOpt = findClientById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Client not found.");
        }

        Client client = clientOpt.get();
        ClientMembershipRenewRequest safeReq = (req == null) ? new ClientMembershipRenewRequest() : req;

        // Determine which membership plan to use
        Optional<MembershipPlan> planOpt;
        if (safeReq.getMembershipPlanId() != null && safeReq.getMembershipPlanId() > 0) {
            planOpt = membershipPlanRepository.findById(safeReq.getMembershipPlanId());
        } else if (client.getMembershipPlan() != null) {
            planOpt = Optional.of(client.getMembershipPlan());
        } else {
            return ResponseEntity.badRequest().body("A membership plan must be specified or assigned to the client.");
        }

        if (planOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Membership plan not found.");
        }

        MembershipPlan plan = planOpt.get();
        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            return ResponseEntity.badRequest().body("Only active membership plans can be assigned.");
        }

        // Determine start date
        LocalDate startDate = safeReq.getStartDate() != null ? safeReq.getStartDate() : LocalDate.now();
        LocalDate endDate = startDate.plusDays(plan.getDurationDays().longValue());

        client.setMembershipPlan(plan);
        client.setMembershipStartDate(startDate);
        client.setMembershipEndDate(endDate);
        client.setMembershipSuspended(false); // Renewing removes any suspension
        clientRepository.save(client);
        return ResponseEntity.ok(toDetailResponse(client));
    }

    private String resolveMembershipStatus(MembershipPlan plan, LocalDate startDate, LocalDate endDate) {
        if (plan == null) {
            return "NOT_ASSIGNED";
        }
        if (startDate == null || endDate == null) {
            return "PENDING";
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) {
            return "UPCOMING";
        }
        if (today.isAfter(endDate)) {
            return "EXPIRED";
        }
        return "ACTIVE";
    }

    private MembershipPeriod deriveMembershipPeriod(Client client) {
        if (client.getMembershipPlan() == null || client.getMembershipPlan().getDurationDays() == null || client.getCreatedAt() == null) {
            return new MembershipPeriod(null, null);
        }

        LocalDate startDate = client.getCreatedAt().toLocalDate();
        LocalDate endDate = startDate.plusDays(client.getMembershipPlan().getDurationDays().longValue());
        return new MembershipPeriod(startDate, endDate);
    }

    private record MembershipPeriod(LocalDate startDate, LocalDate endDate) {
    }
}
