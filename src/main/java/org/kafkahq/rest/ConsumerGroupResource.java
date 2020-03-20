package org.kafkahq.rest;

import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import lombok.extern.slf4j.Slf4j;
import org.kafkahq.service.ConsumerGroupService;
import org.kafkahq.service.dto.ConsumerGroup.ConsumerGroupMemberDTO;

import javax.annotation.Nullable;
import javax.inject.Inject;
import org.kafkahq.service.dto.ConsumerGroup.ConsumerGroupListDTO;
import org.kafkahq.service.dto.ConsumerGroup.ConsumerGroupOffsetDTO;
import org.kafkahq.service.dto.ConsumerGroup.DeleteConsumerGroupDTO;
import org.kafkahq.service.dto.topic.DeleteTopicDTO;
import org.kafkahq.service.dto.topic.TopicListDTO;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Slf4j
@Controller("${kafkahq.server.base-path:}/api")
public class ConsumerGroupResource {
    private ConsumerGroupService consumerGroupService;

    @Inject
    public ConsumerGroupResource(ConsumerGroupService consumerGroupService) {
        this.consumerGroupService =consumerGroupService;
    }

    @Get("/group")
    public ConsumerGroupListDTO fetchAllConsumerGroup(String clusterId,  @Nullable String search, Optional<Integer> pageNumber) throws ExecutionException, InterruptedException {
        log.debug("Fetch all Consumer Groups");
        return consumerGroupService.getConsumerGroup(clusterId,  Optional.ofNullable(search), pageNumber);
    }

    @Get("/group/topics")
    public List<ConsumerGroupOffsetDTO> fetchConsumerGroupOffsets(String clusterId, String groupId ) throws ExecutionException, InterruptedException {
        log.debug("Fetch data from topic: {}", groupId);
        return consumerGroupService.getConsumerGroupOffsets(clusterId,groupId);
    }


    @Get("/group/members")
    public List<ConsumerGroupMemberDTO> fetchAllConsumerGroupMembers(String clusterId , String groupId ) throws ExecutionException, InterruptedException {
        log.debug("Fetch all Consumer Groups");
        return consumerGroupService.getConsumerGroupMembers(clusterId, groupId);
    }
    @Delete("/group/delete")
    public ConsumerGroupListDTO deleteConsumerGroup(@Body DeleteConsumerGroupDTO deleteConsumerGroupDTO) throws ExecutionException, InterruptedException {
        log.debug("Delete Consumer Group: {}", deleteConsumerGroupDTO.getGroupId());
        consumerGroupService.deleteConsumerGroup(deleteConsumerGroupDTO.getClusterId(), deleteConsumerGroupDTO.getGroupId());
        return consumerGroupService.getConsumerGroup(deleteConsumerGroupDTO.getClusterId(), Optional.empty(), Optional.empty());
    }


}


